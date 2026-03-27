#!/bin/sh

set -eu

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_ENV_FILE="$ROOT_DIR/backend/.env"
if [ -x "/usr/local/opt/libpq/bin/pg_dump" ]; then
  PG_DUMP_BIN="/usr/local/opt/libpq/bin/pg_dump"
  PSQL_BIN="/usr/local/opt/libpq/bin/psql"
  CREATEDB_BIN="/usr/local/opt/libpq/bin/createdb"
else
  PG_DUMP_BIN="pg_dump"
  PSQL_BIN="psql"
  CREATEDB_BIN="createdb"
fi

normalize_local_database_url() {
  node -e "
    const url = new URL(process.argv[1]);
    url.search = '';
    console.log(url.toString());
  " "$1"
}

normalize_live_database_url() {
  node -e "
    const url = new URL(process.argv[1]);
    if (!url.searchParams.has('sslmode')) {
      url.searchParams.set('sslmode', 'require');
    }
    console.log(url.toString());
  " "$1"
}

read_local_database_url() {
  if [ -n "${LOCAL_DATABASE_URL:-}" ]; then
    printf '%s\n' "$LOCAL_DATABASE_URL"
    return 0
  fi

  if [ -f "$BACKEND_ENV_FILE" ]; then
    LOCAL_URL="$(sed -n 's/^DATABASE_URL="\([^"]*\)"$/\1/p' "$BACKEND_ENV_FILE" | head -n 1)"
    if [ -n "${LOCAL_URL:-}" ]; then
      printf '%s\n' "$LOCAL_URL"
      return 0
    fi
  fi

  return 1
}

LIVE_URL_RAW="${LIVE_DATABASE_URL:-${PRODUCTION_DATABASE_URL:-}}"
LOCAL_URL_RAW="$(read_local_database_url || true)"

if [ -z "${LIVE_URL_RAW:-}" ]; then
  echo "Missing LIVE_DATABASE_URL."
  echo "Example:"
  echo '  LIVE_DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require" npm run db:pull-live'
  exit 1
fi

if [ -z "${LOCAL_URL_RAW:-}" ]; then
  echo "Missing local DATABASE_URL."
  echo "Set LOCAL_DATABASE_URL or add DATABASE_URL to backend/.env."
  exit 1
fi

LIVE_URL="$(normalize_live_database_url "$LIVE_URL_RAW")"
LOCAL_URL="$(normalize_local_database_url "$LOCAL_URL_RAW")"

LOCAL_DB_NAME="$(node -e "const u = new URL(process.argv[1]); console.log(u.pathname.replace(/^\\//, ''))" "$LOCAL_URL")"

if ! "$PSQL_BIN" "$LOCAL_URL" -c "select 1" >/dev/null 2>&1; then
  echo "Local database '$LOCAL_DB_NAME' not reachable. Trying to create it..."
  "$CREATEDB_BIN" "$LOCAL_DB_NAME" >/dev/null 2>&1 || true
fi

echo "Pulling live database into local database '$LOCAL_DB_NAME'..."
echo "This will overwrite local data."

TMP_DUMP_FILE="$(mktemp "${TMPDIR:-/tmp}/purjix-live-db.XXXXXX.sql")"
trap 'rm -f "$TMP_DUMP_FILE"' EXIT INT TERM

"$PG_DUMP_BIN" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  "$LIVE_URL" > "$TMP_DUMP_FILE"

"$PSQL_BIN" "$LOCAL_URL" < "$TMP_DUMP_FILE"

echo "Local database refreshed from live."
