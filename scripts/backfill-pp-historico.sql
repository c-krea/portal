-- Recompute tenants.pp_historico_pct + pp_historico_pagos from payments table.
-- Idempotent: safe to re-run after new payments sync.
--
-- Formula (WOR-69):
--   Dedupe paired rows (RK + 001-RK collapse to one cash movement).
--   Filters: real invoices only (siesa_cruce LIKE 'FVS-%'), exclude $4.2B FUSION GRAFIK 2024 error.
--   Numerator   = deduped rows where pronto_pago_aplicado > 0
--   Denominator = all deduped rows
--   ≥10 deduped pagos → real per-tenant rate
--   <10 deduped pagos → global PP rate fallback (computed from same dataset)
--
-- Old formula (pre-WOR-69) double-counted paired rows AND skipped NO PROYECTADO
-- rows that carried PP discount, leaving most tenants stuck near the global fallback.

WITH deduped AS (
  SELECT DISTINCT ON (tenant_id, siesa_cruce, fecha_recaudo)
    tenant_id,
    pronto_pago_aplicado
  FROM payments
  WHERE tenant_id IS NOT NULL
    AND siesa_cruce LIKE 'FVS-%'
    AND valor_final < 1000000000
  ORDER BY tenant_id, siesa_cruce, fecha_recaudo, id
),
recompute AS (
  SELECT
    tenant_id,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE pronto_pago_aplicado > 0) AS pp
  FROM deduped
  GROUP BY tenant_id
),
global AS (
  SELECT ROUND(SUM(pp)::numeric * 100 / NULLIF(SUM(total), 0), 2) AS pct
  FROM recompute
)
UPDATE tenants t
SET
  pp_historico_pagos = COALESCE(r.total, 0),
  pp_historico_pct = CASE
    WHEN COALESCE(r.total, 0) >= 10
      THEN ROUND((r.pp::numeric / r.total) * 100, 2)
    ELSE (SELECT pct FROM global)
  END
FROM (
  SELECT t2.id, r2.total, r2.pp
  FROM tenants t2
  LEFT JOIN recompute r2 ON r2.tenant_id = t2.id
) r
WHERE t.id = r.id;
