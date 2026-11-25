-- Cuentas de cobro: entered by hand on the Resumen (admin / finanzas), one value per
-- month for ejecutado and proyectado. Every save also appends a row to
-- v2.cuentas_cobro_historial with who changed it, when, and the before/after values.
-- Both writes happen in one statement (src/lib/data/cuentas-cobro.ts), so the history
-- can never miss a change.
-- Idempotent: CREATE ... IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS v2.cuentas_cobro_mensuales (
    empresa_id       uuid    NOT NULL REFERENCES v2.empresas(id),
    periodo          text    NOT NULL CHECK (periodo ~ '^\d{4}-(0[1-9]|1[0-2])$'),
    ejecutado        numeric NOT NULL DEFAULT 0 CHECK (ejecutado >= 0),
    proyectado       numeric NOT NULL DEFAULT 0 CHECK (proyectado >= 0),
    actualizado_por  uuid    NOT NULL,
    updated_at       timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (empresa_id, periodo)
);
ALTER TABLE v2.cuentas_cobro_mensuales ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE v2.cuentas_cobro_mensuales IS 'Cuentas de cobro del mes (ejecutado y proyectado), registradas a mano en el Resumen por admin/finanzas. Current value only; every change is logged in v2.cuentas_cobro_historial. RLS enabled with no policies, service_role-only by design.';

CREATE TABLE IF NOT EXISTS v2.cuentas_cobro_historial (
    id                   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    empresa_id           uuid    NOT NULL REFERENCES v2.empresas(id),
    periodo              text    NOT NULL,
    ejecutado_anterior   numeric,          -- NULL on the first registration of the month
    proyectado_anterior  numeric,
    ejecutado            numeric NOT NULL,
    proyectado           numeric NOT NULL,
    usuario_id           uuid    NOT NULL,
    usuario_nombre       text,             -- snapshot: stays readable if the user is renamed or removed
    usuario_email        text,
    created_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cuentas_cobro_historial_periodo_idx
    ON v2.cuentas_cobro_historial (empresa_id, periodo, created_at DESC);
ALTER TABLE v2.cuentas_cobro_historial ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE v2.cuentas_cobro_historial IS 'Historial de cambios de v2.cuentas_cobro_mensuales: quién, cuándo, valor anterior y nuevo. Append-only from the app. RLS enabled with no policies, service_role-only by design.';
