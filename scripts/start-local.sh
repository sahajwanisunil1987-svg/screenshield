#!/bin/sh

set -eu

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RUN_DIR="$ROOT_DIR/.local-run"
BACKEND_PID_FILE="$RUN_DIR/backend.pid"
FRONTEND_PID_FILE="$RUN_DIR/frontend.pid"
BACKEND_LOG="$RUN_DIR/backend.log"
FRONTEND_LOG="$RUN_DIR/frontend.log"
LEGACY_PID_FILE="$RUN_DIR/app.pid"
LEGACY_LOG_FILE="$RUN_DIR/app.log"

mkdir -p "$RUN_DIR"
rm -f "$LEGACY_PID_FILE" "$LEGACY_LOG_FILE"

cleanup_stale_pid() {
  PID_FILE="$1"
  if [ -f "$PID_FILE" ]; then
    PID="$(cat "$PID_FILE" 2>/dev/null || true)"
    if [ -n "${PID:-}" ] && kill -0 "$PID" 2>/dev/null; then
      return 0
    fi
    rm -f "$PID_FILE"
  fi
  return 1
}

if cleanup_stale_pid "$BACKEND_PID_FILE" || cleanup_stale_pid "$FRONTEND_PID_FILE"; then
  echo "Local project is already running."
  echo "Backend log:  $BACKEND_LOG"
  echo "Frontend log: $FRONTEND_LOG"
  exit 0
fi

cd "$ROOT_DIR"

nohup env \
  NEXT_PUBLIC_API_BASE_URL="http://localhost:4000/api" \
  NEXT_PUBLIC_SITE_URL="http://localhost:3000" \
  npm run dev:backend >"$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
echo "$BACKEND_PID" > "$BACKEND_PID_FILE"

nohup env \
  NEXT_PUBLIC_API_BASE_URL="http://localhost:4000/api" \
  NEXT_PUBLIC_SITE_URL="http://localhost:3000" \
  npm run dev:frontend >"$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
echo "$FRONTEND_PID" > "$FRONTEND_PID_FILE"

echo "Local project started."
echo "Backend PID:  $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:4000"
echo "Logs:"
echo "  $BACKEND_LOG"
echo "  $FRONTEND_LOG"
