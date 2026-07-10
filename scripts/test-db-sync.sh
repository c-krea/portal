#!/usr/bin/env bash
# Refresh the LOCAL test DB from PROD — Ckrea's footprint only.
#
#   Full  v2  schema  +  ONLY Ckrea's tables in the SHARED siesa_raw schema.
#   siesa_raw ALSO holds other apps' data (ventas_detalle 3.7GB, movimientos_inv 1.2GB, …)
#   — we deliberately DO NOT copy those.
#
#   Structure for all listed siesa_raw tables (so v2 views build); DATA only for the small ones.
#   recaudo (130MB) + estado_resultados (189MB) drop the pooler's SSL on long COPYs and the
#   mora feature needs neither — they load EMPTY. Backfill later if pagos/energy needs them.
#
#   NOTE: pg_dump ignores --schema when --table is also given, so v2 and siesa_raw are dumped
#   SEPARATELY, then loaded siesa_raw-first (v2 views depend on siesa_raw tables).
#
#   PROD  = read-only source (DATABASE_URL in .env.local, shared Reymon DB)
#   LOCAL = write target (SUPABASE_DB_URL in .env.test, Docker :54622) — guarded
#
# Never writes to prod. Re-run any time for a fresh real-data copy.
set -euo pipefail
cd "$(dirname "$0")/.."

RAW_SCHEMA_TABLES=(cartera documentos ocupacion recaudo estado_resultados sync_batches)
RAW_DATA_TABLES=(cartera documentos ocupacion sync_batches)

# --- source (prod, read-only) — keep the password out of argv/ps ---
PROD=$(grep -E '^DATABASE_URL=' .env.local | cut -d= -f2- | tr -d '"')
[[ -n "$PROD" ]] || { echo "❌ DATABASE_URL not found in .env.local"; exit 1; }
export PGPASSWORD=$(echo "$PROD" | sed -E 's#^[^:]+://[^:]+:([^@]+)@.*#\1#')
PROD=$(echo "$PROD" | sed -E 's#(^[^:]+://[^:]+):[^@]+@#\1@#')

# --- target (local, write) — guarded ---
set -a; source .env.test; set +a
LOCAL="${SUPABASE_DB_URL:?SUPABASE_DB_URL missing in .env.test}"
bash scripts/assert-local-db.sh "$LOCAL"

SIESA_SCHEMA_ARGS=(); for t in "${RAW_SCHEMA_TABLES[@]}"; do SIESA_SCHEMA_ARGS+=(--table="siesa_raw.$t"); done
SIESA_DATA_ARGS=();   for t in "${RAW_DATA_TABLES[@]}";   do SIESA_DATA_ARGS+=(--table="siesa_raw.$t"); done

mkdir -p .test-data
echo "▶ Dumping siesa_raw SCHEMA (${RAW_SCHEMA_TABLES[*]})…"
pg_dump "$PROD" "${SIESA_SCHEMA_ARGS[@]}" --schema-only --no-owner --no-privileges -f .test-data/siesa.schema.sql
echo "▶ Dumping v2 SCHEMA (full)…"
pg_dump "$PROD" --schema=v2 --schema-only --no-owner --no-privileges -f .test-data/v2.schema.sql
echo "▶ Dumping siesa_raw DATA (${RAW_DATA_TABLES[*]}; recaudo/estado_resultados stay empty)…"
pg_dump "$PROD" "${SIESA_DATA_ARGS[@]}" --data-only --no-owner -f .test-data/siesa.data.sql
echo "▶ Dumping v2 DATA (full)…"
pg_dump "$PROD" --schema=v2 --data-only --no-owner -f .test-data/v2.data.sql

echo "▶ Preparing local schemas + stub roles…"
psql "$LOCAL" -v ON_ERROR_STOP=1 -q <<'SQL'
DROP SCHEMA IF EXISTS v2 CASCADE;
DROP SCHEMA IF EXISTS siesa_raw CASCADE;
CREATE SCHEMA IF NOT EXISTS siesa_raw;
DO $$ BEGIN CREATE ROLE siesa_sync NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
SQL

# ON_ERROR_STOP=0: tolerate skipped RLS policies referencing prod-only roles.
# Load siesa_raw FIRST (v2 views depend on it), then v2. Verify what matters afterward.
echo "▶ Loading siesa_raw schema…"
psql "$LOCAL" -v ON_ERROR_STOP=0 -q -f .test-data/siesa.schema.sql 2>&1 \
  | grep -iE '^ERROR' | grep -viE 'role .* does not exist|policy|already exists' | head -20 || true
echo "▶ Loading v2 schema…"
psql "$LOCAL" -v ON_ERROR_STOP=0 -q -f .test-data/v2.schema.sql 2>&1 \
  | grep -iE '^ERROR' | grep -viE 'role .* does not exist|policy|already exists' | head -20 || true

echo "▶ Installing local RPC helpers (public.exec_sql / exec_dml — the app's execute())…"
if [[ -f scripts/local-rpc-functions.sql ]]; then
  psql "$LOCAL" -v ON_ERROR_STOP=1 -q -f scripts/local-rpc-functions.sql
else
  echo "  ⚠ scripts/local-rpc-functions.sql missing — run once from prod, or the app can't read locally"
fi

echo "▶ Loading data (FK triggers disabled)…"
{ echo "SET session_replication_role = replica;"; cat .test-data/siesa.data.sql .test-data/v2.data.sql; } \
  | psql "$LOCAL" -v ON_ERROR_STOP=0 -q 2>&1 | grep -iE '^ERROR' | head -20 || true

echo "▶ Verifying the objects the app needs exist:"
psql "$LOCAL" -tAc "
select object||' : '||(case when ok then 'OK' else 'MISSING ❌' end) from (
  select 'v2.inquilinos'            o, to_regclass('v2.inquilinos')            is not null ok union all
  select 'v2.contratos',            to_regclass('v2.contratos')            is not null union all
  select 'v2.locales',              to_regclass('v2.locales')              is not null union all
  select 'v2.reglas_financieras',   to_regclass('v2.reglas_financieras')   is not null union all
  select 'v2.vista_cartera_actual', to_regclass('v2.vista_cartera_actual') is not null union all
  select 'siesa_raw.cartera',       to_regclass('siesa_raw.cartera')       is not null union all
  select 'siesa_raw.documentos',    to_regclass('siesa_raw.documentos')    is not null
) t(object, ok) order by object;"

echo "▶ Row counts (local):"
psql "$LOCAL" -tAc "select 'v2.inquilinos = '||count(*) from v2.inquilinos;"
psql "$LOCAL" -tAc "select 'v2.contratos  = '||count(*) from v2.contratos;"
psql "$LOCAL" -tAc "select 'siesa_raw.cartera    = '||count(*) from siesa_raw.cartera;"
psql "$LOCAL" -tAc "select 'siesa_raw.documentos = '||count(*) from siesa_raw.documentos;"
psql "$LOCAL" -tAc "select 'v2.vista_cartera_actual (rows) = '||count(*) from v2.vista_cartera_actual;"

echo "✅ Local test DB refreshed (full v2 + Ckrea's siesa_raw tables). Nothing was written to prod."
