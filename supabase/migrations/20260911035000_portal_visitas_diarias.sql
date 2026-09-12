-- WOR-318: recording half of tenant portal usage-over-time. Accumulates one row
-- per tenant per DAY (America/Bogota); a future issue builds the chart on top.
-- The sole login signal today (auth.users.last_sign_in_at) is overwritten on
-- every login, so history must be recorded starting now.
-- Verified on the local test DB; the Planner applies this exact DDL to prod separately.
-- Idempotent: safe to re-run (CREATE TABLE/INDEX IF NOT EXISTS; ALTER/COMMENT
-- are no-ops on repeat; inserts use ON CONFLICT DO NOTHING, never UPDATE/DELETE).

CREATE TABLE IF NOT EXISTS v2.portal_visitas_diarias (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id      uuid NOT NULL REFERENCES v2.empresas(id),
    inquilino_id    uuid NOT NULL REFERENCES v2.inquilinos(id),
    auth_user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dia             date NOT NULL,  -- calendar day in America/Bogota, not UTC
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (auth_user_id, dia)
);
ALTER TABLE v2.portal_visitas_diarias ENABLE ROW LEVEL SECURITY;

-- Per-empresa day range scans for the future usage chart.
CREATE INDEX IF NOT EXISTS idx_portal_visitas_empresa_dia
    ON v2.portal_visitas_diarias (empresa_id, dia);

COMMENT ON TABLE v2.portal_visitas_diarias IS 'Tenant portal visits, one row per tenant per America/Bogota day (WOR-318). Append-only daily grain for the usage-over-time chart; inserts use ON CONFLICT DO NOTHING, nothing ever updates or deletes a row. RLS enabled with no policies, service_role-only by design.';
COMMENT ON COLUMN v2.portal_visitas_diarias.dia IS 'Calendar day of the visit in America/Bogota: (now() AT TIME ZONE ''America/Bogota'')::date, matching the portal''s Bogota-day handling. Never UTC CURRENT_DATE.';
