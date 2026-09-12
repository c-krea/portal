-- WOR-310: daily upsert of the current month's mora totals. Feeds the /mora trend chart.
-- Verified on the local test DB; the Planner applies this exact DDL to prod separately.
-- Idempotent: safe to re-run (CREATE TABLE IF NOT EXISTS; ALTER/COMMENT are no-ops on repeat;
-- the upsert itself is idempotent per (empresa_id, periodo) via ON CONFLICT).

CREATE TABLE IF NOT EXISTS v2.mora_snapshots_mensuales (
    empresa_id     uuid NOT NULL REFERENCES v2.empresas(id),
    periodo        text NOT NULL,        -- 'YYYY-MM'
    clientes       integer NOT NULL,
    saldo_vencido  numeric NOT NULL,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (empresa_id, periodo)
);
ALTER TABLE v2.mora_snapshots_mensuales ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE v2.mora_snapshots_mensuales IS 'Daily upsert of the current month''s mora totals (WOR-310). Feeds the /mora trend chart. Grain is one row per calendar month, overwritten daily until the month closes — not a daily time series. Mutable derived cache from v2.vista_cartera_actual, not a ledger record, never audit-relied-upon. RLS enabled with no policies, service_role-only by design.';
