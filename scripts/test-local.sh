#!/usr/bin/env bash
# Run the test suite against the LOCAL test DB (never prod).
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env.test; set +a
bash scripts/assert-local-db.sh "$SUPABASE_DB_URL"
echo "▶ npm test → LOCAL test DB ($NEXT_PUBLIC_SUPABASE_URL)"
npm test
