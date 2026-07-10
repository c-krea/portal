#!/usr/bin/env bash
# Guard: refuse to run unless the target DB is the LOCAL test DB (127.0.0.1:54622).
# Prevents any test/dev/sync from ever writing to the shared production database.
set -euo pipefail

TARGET="${1:-${SUPABASE_DB_URL:-${DATABASE_URL:-}}}"
redact() { echo "$1" | sed -E 's#://[^@/]*@#://***:***@#'; }

if [[ -z "$TARGET" ]]; then
  echo "❌ assert-local-db: no target DB URL (SUPABASE_DB_URL/DATABASE_URL empty)"; exit 1
fi

case "$TARGET" in
  *127.0.0.1:54622*|*localhost:54622*)
    echo "✅ assert-local-db: target is LOCAL ($(redact "$TARGET"))"; exit 0;;
  *)
    echo "❌ assert-local-db: REFUSING — target is NOT the local test DB (:54622)"
    echo "   got: $(redact "$TARGET")"; exit 1;;
esac
