-- Cierre mensual del Resumen: one frozen row per (empresa, month) with the figures the
-- Resumen page showed when the month was closed. Written by /api/cron/resumen-cierre on
-- the 2nd business day of the next month at 18:00 Bogotá; the page reads past months from
-- here instead of recomputing them (siesa_raw.documentos is a rolling window, so old
-- months stop being recomputable).
-- Idempotent: CREATE TABLE IF NOT EXISTS; the cron upserts per (empresa_id, periodo).

CREATE TABLE IF NOT EXISTS v2.resumen_cierres_mensuales (
    empresa_id            uuid    NOT NULL REFERENCES v2.empresas(id),
    periodo               text    NOT NULL CHECK (periodo ~ '^\d{4}-(0[1-9]|1[0-2])$'),
    canon                 numeric NOT NULL,
    canon_proyectado      numeric NOT NULL,
    mora                  numeric NOT NULL,
    mora_proyectado       numeric NOT NULL,
    luz                   numeric NOT NULL,
    luz_proyectado        numeric NOT NULL,
    cuentas               numeric NOT NULL,
    cuentas_proyectado    numeric NOT NULL,
    descuento_financiero  numeric NOT NULL,
    descuento_comercial   numeric NOT NULL,
    deposito              numeric NOT NULL,
    total_recaudo         numeric NOT NULL,
    total_proyectado      numeric NOT NULL,
    locales_ocupados      integer,          -- NULL when the month was closed late (backfill):
    locales_total         integer,          -- occupancy is only known live, not per past month
    origen                text    NOT NULL CHECK (origen IN ('cron', 'manual')),
    generado_at           timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (empresa_id, periodo)
);
ALTER TABLE v2.resumen_cierres_mensuales ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE v2.resumen_cierres_mensuales IS 'Cierre mensual del Resumen (canon, mora, luz, cuentas de cobro, descuentos, depósito, ocupación). One row per month, frozen on the 2nd business day of the next month by /api/cron/resumen-cierre; re-closing a month overwrites it. The Resumen page reads past months from here. RLS enabled with no policies, service_role-only by design.';
