#!/bin/bash
# Weekly EIA fuel data update, run by launchd (com.jermaine.fsctracker).
# launchd provides a minimal PATH, so Homebrew's node/npx must be added
# explicitly or the Vercel deploy step fails with "npx: command not found".

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

PROJECT_DIR="/Users/jermaine/fuel-tracker"
LOG="$HOME/Library/Logs/fsctracker-update.log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG"; }

log "=== run start ==="

cd "$PROJECT_DIR" || { log "FAIL: cannot cd to $PROJECT_DIR"; exit 1; }

if ! command -v npx >/dev/null 2>&1; then
  log "FAIL: npx not on PATH ($PATH)"
  exit 1
fi

python3 update-data.py >> "$LOG" 2>&1
status=$?

if [ $status -eq 0 ]; then
  log "=== run finished OK ==="
else
  log "=== run FAILED (exit $status) ==="
fi

exit $status
