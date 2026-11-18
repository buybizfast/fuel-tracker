#!/bin/bash
# Weekly EIA fuel data update, run by launchd (com.jermaine.fsctracker).
#
# launchd wakes this every 15 minutes on Tuesdays and Wednesdays, in the Mac's
# local time zone. The window itself is pinned to US Central here, so travel
# to another time zone doesn't shift it:
#   - Tuesday and Wednesday, 9:00-10:00 AM Central, checks at :00/:15/:30/:45.
#   - Each check publishes only if EIA has a newer week than the site, so
#     Wednesday checks are no-ops once Tuesday has picked up the data.
# launchd gives a minimal PATH, so Homebrew's node/npx must be added explicitly.

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

PROJECT_DIR="/Users/jermaine/fuel-tracker"
LOG="$HOME/Library/Logs/fsctracker-update.log"

day=$(TZ=America/Chicago date +%u)              # 1=Mon .. 7=Sun
mins=$((10#$(TZ=America/Chicago date +%H) * 60 + 10#$(TZ=America/Chicago date +%M)))
if { [ "$day" != 2 ] && [ "$day" != 3 ]; } || [ "$mins" -lt 540 ] || [ "$mins" -gt 600 ]; then
  exit 0   # outside Tue/Wed 9:00-10:00 Central; exit silently to keep the log readable
fi

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S %Z')] $*" >> "$LOG"; }

log "=== check start ==="

cd "$PROJECT_DIR" || { log "FAIL: cannot cd to $PROJECT_DIR"; exit 1; }

if ! command -v npx >/dev/null 2>&1; then
  log "FAIL: npx not on PATH ($PATH)"
  exit 1
fi

python3 -u update-data.py --only-if-new >> "$LOG" 2>&1
status=$?

if [ $status -eq 0 ]; then
  log "=== check finished OK ==="
else
  log "=== check FAILED (exit $status) ==="
fi

exit $status
