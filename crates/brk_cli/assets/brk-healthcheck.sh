#!/usr/bin/env bash
# Managed by BRK.
# Optional overrides can be placed in ~/.config/brk-healthcheck.env.
#
# BRK has three progress signals that can advance independently:
#   - indexed_height:  the raw indexer's tip (advances quickly block-by-block).
#   - computed_height: the computer's tip (advances during the long compute
#                      phase, when the indexer is otherwise idle waiting on a
#                      new block).
#   - effective_height: how far the computed-series processing has caught up
#                       (older field name; some builds omit it, in which case
#                       the API returns 0 here — treat absence as "use the
#                       other two signals").
#
# A healthy BRK may legitimately sit at a single signal for longer than a poll
# interval — e.g. indexed_height freezes while the compute phase walks through
# the chain. Treat forward progress at ANY of the three signals as alive and
# only restart when ALL three are stalled for several consecutive polls. This
# avoids the failure mode where the watchdog killed a perfectly-healthy BRK
# during a slow compute cycle just because indexed_height hadn't moved between
# two 5-minute polls.
#
# State: $XDG_RUNTIME_DIR/brk-healthcheck.state holds:
#   <prev_effective_height> <prev_indexed_height> <prev_computed_height> <consecutive_bad_polls>
# Older 3-field (<eff> <indexed> <bad_polls>) and 2-field (<eff> <bad_polls>)
# state formats are still accepted for backward-compatibility across upgrades.

set -euo pipefail

BRK_URL="${BRK_URL:-http://127.0.0.1:3110}"
MAX_EFFECTIVE_BLOCKS_BEHIND="${MAX_EFFECTIVE_BLOCKS_BEHIND:-0}"
STARTUP_GRACE_SECS="${STARTUP_GRACE_SECS:-180}"
CONSECUTIVE_BAD_POLLS="${CONSECUTIVE_BAD_POLLS:-6}"
TIP_AGE_THRESHOLD_SECS="${TIP_AGE_THRESHOLD_SECS:-3600}"
STATE_DIR="${XDG_RUNTIME_DIR:-/tmp}"
STATE_FILE="${STATE_DIR}/brk-healthcheck.state"

log() { echo "[brk-healthcheck] $*"; }

load_state() {
    prev_effective_height=0
    prev_indexed_height=0
    prev_computed_height=0
    bad_polls=0

    if [[ -f "$STATE_FILE" ]]; then
        local line
        line="$(cat "$STATE_FILE" 2>/dev/null || true)"
        local fields
        # shellcheck disable=SC2206
        fields=( $line )
        case "${#fields[@]}" in
            4)
                prev_effective_height="${fields[0]}"
                prev_indexed_height="${fields[1]}"
                prev_computed_height="${fields[2]}"
                bad_polls="${fields[3]}"
                ;;
            3)
                # Legacy 3-field format from BRK 0.3.0-beta.9 and earlier.
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
    prev_computed_height="${prev_computed_height:-0}"
    bad_polls="${bad_polls:-0}"
}

save_state() {
    printf '%s %s %s %s\n' "$1" "$2" "$3" "$4" > "$STATE_FILE"
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
    local computed="$4"

    bad_polls=$(( bad_polls + 1 ))
    save_state "$effective" "$indexed" "$computed" "$bad_polls"

    if (( bad_polls < CONSECUTIVE_BAD_POLLS )); then
        log "BAD POLL ${bad_polls}/${CONSECUTIVE_BAD_POLLS}: $reason"
        exit 0
    fi

    restart_brk "$reason"
}

# Forward progress on any of the three signals counts as alive. Most
# importantly, computed_height advances during the long compute phase when
# indexed_height is otherwise frozen — a previous version of this script
# tracked only effective_height + indexed_height and restarted BRK mid-compute
# because the indexer hadn't written a new stamp in 20 minutes.
is_progressing() {
    (( effective_height > prev_effective_height \
       || indexed_height > prev_indexed_height \
       || computed_height > prev_computed_height ))
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
    record_bad_poll "BRK /api/server/sync unreachable" \
        "$prev_effective_height" "$prev_indexed_height" "$prev_computed_height"
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
    record_bad_poll "/api/server/sync returned malformed data" \
        "$prev_effective_height" "$prev_indexed_height" "$prev_computed_height"
fi

tip_age=$(( now - last_unix ))

# Silent-stall guard. BRK's effective_blocks_behind self-report can drop to 0
# when its tip-fetcher dies (it no longer knows bitcoind is ahead). The
# wall-clock age of last_indexed_at is the only reliable witness in that
# state. Require both stale tip AND no height advance this poll across all
# three signals, so natural >threshold inter-block gaps don't flap the
# watchdog and slow compute phases aren't mistaken for stalls.
if (( tip_age > TIP_AGE_THRESHOLD_SECS )); then
    if is_progressing; then
        save_state "$effective_height" "$indexed_height" "$computed_height" 0
        log "TIP STALE BUT PROGRESSING: tip_age=${tip_age}s effective=${prev_effective_height}→${effective_height} indexed=${prev_indexed_height}→${indexed_height} computed=${prev_computed_height}→${computed_height}"
        exit 0
    fi
    record_bad_poll \
        "tip_age=${tip_age}s > ${TIP_AGE_THRESHOLD_SECS}s without height advance (silent stall: blocks_behind self-report unreliable)" \
        "$effective_height" "$indexed_height" "$computed_height"
fi

if (( effective_blocks_behind <= MAX_EFFECTIVE_BLOCKS_BEHIND )); then
    save_state "$effective_height" "$indexed_height" "$computed_height" 0
    log "OK: tip_age=${tip_age}s effective_blocks_behind=${effective_blocks_behind} effective_height=${effective_height} indexed=${indexed_height} computed=${computed_height}"
    exit 0
fi

if is_progressing; then
    save_state "$effective_height" "$indexed_height" "$computed_height" 0
    log "CATCHING UP: tip_age=${tip_age}s effective_blocks_behind=${effective_blocks_behind} effective_height=${prev_effective_height}→${effective_height} indexed=${prev_indexed_height}→${indexed_height} computed=${prev_computed_height}→${computed_height}"
    exit 0
fi

record_bad_poll \
    "stall: tip_age=${tip_age}s effective_blocks_behind=${effective_blocks_behind} effective_height=${effective_height} indexed=${indexed_height} computed=${computed_height} (no signal advanced)" \
    "$effective_height" "$indexed_height" "$computed_height"
