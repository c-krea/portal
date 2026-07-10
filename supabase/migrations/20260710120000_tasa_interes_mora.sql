-- Monthly DIAN late-interest rate (interés de mora), art. 635 E.T.
-- One row per month; the admin enters the Superfinanciera rate each month.
-- The mora engine applies the current month's rate to the whole overdue span.
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS v2.tasa_interes_mora (
  periodo         text PRIMARY KEY,                      -- 'YYYY-MM'
  tasa_ea         numeric NOT NULL CHECK (tasa_ea > 0 AND tasa_ea < 2),  -- effective annual, e.g. 0.2679 = 26,79%
  actualizado_por uuid,                                  -- perfil (auth user) who last set it
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  v2.tasa_interes_mora IS 'Tasa de interés moratorio DIAN (art. 635 E.T.) por mes. Efectiva anual; se divide /366 para la diaria.';
COMMENT ON COLUMN v2.tasa_interes_mora.tasa_ea IS 'Tasa efectiva anual en decimal (0.2679 = 26,79%).';

ALTER TABLE v2.tasa_interes_mora ENABLE ROW LEVEL SECURITY;

-- Seed the known July 2026 rate (26,79% E.A.). Never overwrites an admin edit.
INSERT INTO v2.tasa_interes_mora (periodo, tasa_ea)
VALUES ('2026-07', 0.2679)
ON CONFLICT (periodo) DO NOTHING;
