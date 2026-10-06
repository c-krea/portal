#!/usr/bin/env bash
# Refresh the LOCAL test DB from PROD — Ckrea's footprint only.
#
#   Full  v2  schema  +  ONLY Ckrea's tables in the SHARED siesa_raw schema.
#   siesa_raw ALSO holds other apps' data (ventas_detalle 3.7GB, movimientos_inv 1.2GB, …)
#   — we deliberately DO NOT copy those.
#
#   Structure for all listed siesa_raw tables (so v2 views build); DATA only for the small ones.
#   estado_resultados (189MB) drops the pooler's SSL on a long COPY and nothing reads it yet —
#   it loads EMPTY.
#
#   recaudo IS loaded, but NOT via pg_dump: one long COPY of 639k rows drops the pooler's SSL.
#   It is streamed prod->local a quarter at a time instead (see "chunked backfill" below), which
#   the pooler survives. /pagos is built on it, so an empty recaudo makes the local DB useless
#   for testing that page — both the fast and the slow query return instantly on zero rows.
#   Set SKIP_RECAUDO=1 to skip it when you only need the mora/cartera path (saves ~2 min).
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
echo "▶ Dumping siesa_raw DATA (${RAW_DATA_TABLES[*]}; recaudo comes later, chunked)…"
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

# --- chunked backfill: siesa_raw.recaudo -------------------------------------
# pg_dump/COPY of the whole table dies mid-stream on the pooler's SSL. Quarter-sized
# slices do not. Same rows, arriving in ~11 pieces instead of one.
if [[ "${SKIP_RECAUDO:-0}" == "1" ]]; then
  echo "▶ SKIP_RECAUDO=1 — recaudo left empty (/pagos will not be testable locally)"
else
  echo "▶ Backfilling siesa_raw.recaudo in quarters (long single COPY drops the pooler's SSL)…"
  psql "$LOCAL" -X -q -c "truncate siesa_raw.recaudo;"
  # +3 months from a YYYY-MM-DD date — BSD date (macOS) or GNU date (Linux / Git Bash on Windows).
  plus3m() {
    date -j -v+3m -f "%Y-%m-%d" "$1" "+%Y-%m-%d" 2>/dev/null || date -d "$1 +3 months" "+%Y-%m-%d"
  }
  chunk_start=2024-01-01
  chunk_stop=$(plus3m "$(date "+%Y-%m-%d")")   # a quarter past today, so the newest rows are included
  while [[ "$chunk_start" < "$chunk_stop" ]]; do
    chunk_end=$(plus3m "$chunk_start")
    printf '   %s → %s  ' "$chunk_start" "$chunk_end"
    psql "$PROD" -X -q -c "\copy (select * from siesa_raw.recaudo where fecha_recaudo >= '$chunk_start' and fecha_recaudo < '$chunk_end') to stdout" \
      | psql "$LOCAL" -X -q -c "\copy siesa_raw.recaudo from stdin"
    psql "$LOCAL" -X -qtA -c "select count(*)||' rows' from siesa_raw.recaudo;"
    chunk_start="$chunk_end"
  done
fi

# ANALYZE is not optional: a freshly COPYed table has no statistics, so the planner
# picks different plans locally than in prod — which silently invalidates any
# performance test done here (the exact thing this DB exists for).
echo "▶ ANALYZE (fresh COPY has no stats; without this the planner behaves unlike prod)…"
psql "$LOCAL" -X -q -c "analyze siesa_raw.recaudo; analyze siesa_raw.documentos; analyze siesa_raw.cartera; analyze siesa_raw.ocupacion;"

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
psql "$LOCAL" -tAc "select 'siesa_raw.recaudo    = '||count(*)||' ('||count(*) filter (where id_zona='Z40')||' Z40)' from siesa_raw.recaudo;"
psql "$LOCAL" -tAc "select 'v2.vista_cartera_actual (rows) = '||count(*) from v2.vista_cartera_actual;"

echo "✅ Local test DB refreshed (full v2 + Ckrea's siesa_raw tables). Nothing was written to prod."
