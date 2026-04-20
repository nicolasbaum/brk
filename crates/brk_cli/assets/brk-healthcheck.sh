#!/usr/bin/env bash
# Managed by BRK.
# Optional overrides can be placed in ~/.config/brk-healthcheck.env.
#
# BRK can stay alive while either raw indexing or computed-series processing is
# stalled, so this watchdog uses /api/server/sync's effective_* fields instead
# of only looking at the raw indexer tip. To avoid restart thrash:
# - ignore the first few minutes after a service restart
# - require multiple consecutive bad polls before restarting
# - treat forward progress at effective_height as healthy catch-up
#
# State: $XDG_RUNTIME_DIR/brk-healthcheck.state holds:
#   <previous_effective_height> <consecutive_bad_polls>

set -euo pipefail

BRK_URL="${BRK_URL:-http://127.0.0.1:3110}"
MAX_EFFECTIVE_BLOCKS_BEHIND="${MAX_EFFECTIVE_BLOCKS_BEHIND:-0}"
STARTUP_GRACE_SECS="${STARTUP_GRACE_SECS:-180}"
CONSECUTIVE_BAD_POLLS="${CONSECUTIVE_BAD_POLLS:-2}"
STATE_DIR="${XDG_RUNTIME_DIR:-/tmp}"
STATE_FILE="${STATE_DIR}/brk-healthcheck.state"

log() { echo "[brk-healthcheck] $*"; }

load_state() {
    prev_effective_height=0
    bad_polls=0

    if [[ -f "$STATE_FILE" ]]; then
        read -r prev_effective_height bad_polls < "$STATE_FILE" || true
    fi

    prev_effective_height="${prev_effective_height:-0}"
    bad_polls="${bad_polls:-0}"
}

save_state() {
    printf '%s %s\n' "$1" "$2" > "$STATE_FILE"
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
    local current_effective_height="$2"

    bad_polls=$(( bad_polls + 1 ))
    save_state "$current_effective_height" "$bad_polls"

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
    record_bad_poll "BRK /api/server/sync unreachable" "$prev_effective_height"
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
    record_bad_poll "/api/server/sync returned malformed data" "$prev_effective_height"
fi

tip_age=$(( now - last_unix ))

if (( effective_blocks_behind <= MAX_EFFECTIVE_BLOCKS_BEHIND )); then
    save_state "$effective_height" 0
    log "OK: tip_age=${tip_age}s effective_blocks_behind=${effective_blocks_behind} effective_height=${effective_height} indexed=${indexed_height} computed=${computed_height}"
    exit 0
fi

if (( effective_height > prev_effective_height )); then
    save_state "$effective_height" 0
    log "CATCHING UP: tip_age=${tip_age}s effective_blocks_behind=${effective_blocks_behind} effective_height=${prev_effective_height}→${effective_height} indexed=${indexed_height} computed=${computed_height}"
    exit 0
fi

record_bad_poll \
    "stall: tip_age=${tip_age}s effective_blocks_behind=${effective_blocks_behind} effective_height=${effective_height} indexed=${indexed_height} computed=${computed_height} (no effective progress since last poll)" \
    "$effective_height"
