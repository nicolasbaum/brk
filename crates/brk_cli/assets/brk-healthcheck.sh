#!/usr/bin/env bash
# Managed by BRK.
# Optional overrides can be placed in ~/.config/brk-healthcheck.env.
#
# BRK has two progress signals that can advance independently:
#   - indexed_height: the raw indexer's tip (advances quickly block-by-block)
#   - effective_height: how far the computed-series processing has caught up
#
# A healthy BRK may legitimately sit at a single effective_height for longer
# than a single watchdog poll interval while compute batches catch up or while
# aux-vec compaction runs. The watchdog treats forward progress at EITHER
# signal as alive, and only restarts when BOTH are stalled for several
# consecutive polls. This avoids the failure mode where the watchdog would
# kill a perfectly-healthy indexer just because compute hadn't moved between
# two 5-minute polls.
#
# State: $XDG_RUNTIME_DIR/brk-healthcheck.state holds:
#   <prev_effective_height> <prev_indexed_height> <consecutive_bad_polls>
# Older 2-field states (<prev_effective_height> <bad_polls>) are also accepted
# for backward-compatibility across upgrades.

set -euo pipefail

BRK_URL="${BRK_URL:-http://127.0.0.1:3110}"
MAX_EFFECTIVE_BLOCKS_BEHIND="${MAX_EFFECTIVE_BLOCKS_BEHIND:-0}"
STARTUP_GRACE_SECS="${STARTUP_GRACE_SECS:-180}"
CONSECUTIVE_BAD_POLLS="${CONSECUTIVE_BAD_POLLS:-6}"
STATE_DIR="${XDG_RUNTIME_DIR:-/tmp}"
STATE_FILE="${STATE_DIR}/brk-healthcheck.state"

log() { echo "[brk-healthcheck] $*"; }

load_state() {
    prev_effective_height=0
    prev_indexed_height=0
    bad_polls=0

    if [[ -f "$STATE_FILE" ]]; then
        local line
        line="$(cat "$STATE_FILE" 2>/dev/null || true)"
        local fields
        # shellcheck disable=SC2206
        fields=( $line )
        case "${#fields[@]}" in
            3)
                prev_effective_height="${fields[0]}"
                prev_indexed_height="${fields[1]}"
                bad_polls="${fields[2]}"
                ;;
            2)
                # Legacy 2-field format from older BRK releases.
                prev_effective_height="${fields[0]}"
                bad_polls="${fields[1]}"
                ;;
        esac
    fi

    prev_effective_height="${prev_effective_height:-0}"
    prev_indexed_height="${prev_indexed_height:-0}"
    bad_polls="${bad_polls:-0}"
}

save_state() {
    printf '%s %s %s\n' "$1" "$2" "$3" > "$STATE_FILE"
}

service_start_unix() {
    local started_at
    started_at="$(systemctl --user show brk.service -p ActiveEnterTimestamp --value 2>/dev/null || true)"

    if [[ -z "$started_at" || "$started_at" == "n/a" ]]; then
        echo 0
        return
    fi

    date -d "$started_at" +%s 2>/dev/null || echo 0
}

restart_brk() {
    log "RESTART: $1"
    systemctl --user restart brk.service
    rm -f "$STATE_FILE"
    exit 0
}

record_bad_poll() {
    local reason="$1"
    local effective="$2"
    local indexed="$3"

    bad_polls=$(( bad_polls + 1 ))
    save_state "$effective" "$indexed" "$bad_polls"

    if (( bad_polls < CONSECUTIVE_BAD_POLLS )); then
        log "BAD POLL ${bad_polls}/${CONSECUTIVE_BAD_POLLS}: $reason"
        exit 0
    fi

    restart_brk "$reason"
}

load_state

now="$(date +%s)"
started_at_unix="$(service_start_unix)"
if (( started_at_unix > 0 )); then
    startup_age=$(( now - started_at_unix ))
    if (( startup_age < STARTUP_GRACE_SECS )); then
        rm -f "$STATE_FILE"
        log "STARTUP GRACE: age=${startup_age}s < ${STARTUP_GRACE_SECS}s"
        exit 0
    fi
fi

response="$(curl -sS -m 10 "${BRK_URL}/api/server/sync" || true)"
if [[ -z "$response" ]]; then
    record_bad_poll "BRK /api/server/sync unreachable" "$prev_effective_height" "$prev_indexed_height"
fi

parsed="$(
    echo "$response" | python3 -c '
import json, sys

d = json.load(sys.stdin)
print(
    d.get("effective_height") or 0,
    d.get("effective_blocks_behind") or 0,
    d.get("indexed_height") or 0,
    d.get("computed_height") or 0,
    d.get("last_indexed_at_unix") or 0,
)
' 2>/dev/null || true
)"

read -r effective_height effective_blocks_behind indexed_height computed_height last_unix <<< "$parsed"

if [[ -z "${effective_height:-}" || -z "${last_unix:-}" || "$last_unix" == "0" ]]; then
    record_bad_poll "/api/server/sync returned malformed data" "$prev_effective_height" "$prev_indexed_height"
fi

tip_age=$(( now - last_unix ))

if (( effective_blocks_behind <= MAX_EFFECTIVE_BLOCKS_BEHIND )); then
    save_state "$effective_height" "$indexed_height" 0
    log "OK: tip_age=${tip_age}s effective_blocks_behind=${effective_blocks_behind} effective_height=${effective_height} indexed=${indexed_height} computed=${computed_height}"
    exit 0
fi

if (( effective_height > prev_effective_height || indexed_height > prev_indexed_height )); then
    save_state "$effective_height" "$indexed_height" 0
    log "CATCHING UP: tip_age=${tip_age}s effective_blocks_behind=${effective_blocks_behind} effective_height=${prev_effective_height}→${effective_height} indexed=${prev_indexed_height}→${indexed_height} computed=${computed_height}"
    exit 0
fi

record_bad_poll \
    "stall: tip_age=${tip_age}s effective_blocks_behind=${effective_blocks_behind} effective_height=${effective_height} indexed=${indexed_height} computed=${computed_height} (neither indexed nor effective height advanced)" \
    "$effective_height" \
    "$indexed_height"
