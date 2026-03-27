#!/bin/sh

set -eu

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RUN_DIR="$ROOT_DIR/.local-run"
BACKEND_PID_FILE="$RUN_DIR/backend.pid"
FRONTEND_PID_FILE="$RUN_DIR/frontend.pid"
LEGACY_PID_FILE="$RUN_DIR/app.pid"
LEGACY_LOG_FILE="$RUN_DIR/app.log"

stop_pid_file() {
  PID_FILE="$1"
  LABEL="$2"

  if [ ! -f "$PID_FILE" ]; then
    return 0
  fi

  PID="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [ -n "${PID:-}" ] && kill -0 "$PID" 2>/dev/null; then
    kill "$PID" 2>/dev/null || true
    echo "$LABEL stopped (PID $PID)."
  else
    echo "$LABEL pid file found, but process is already stopped."
  fi

  rm -f "$PID_FILE"
}

if [ ! -f "$BACKEND_PID_FILE" ] && [ ! -f "$FRONTEND_PID_FILE" ]; then
  echo "No pid files found. Cleaning any stray local dev processes."
fi

stop_pid_file "$BACKEND_PID_FILE" "Backend"
stop_pid_file "$FRONTEND_PID_FILE" "Frontend"

pkill -f "next dev" 2>/dev/null || true
pkill -f "tsx watch src/server.ts" 2>/dev/null || true
pkill -f "npm run dev:frontend" 2>/dev/null || true
pkill -f "npm run dev:backend" 2>/dev/null || true

rm -f "$LEGACY_PID_FILE" "$LEGACY_LOG_FILE"

echo "Local project stopped."
