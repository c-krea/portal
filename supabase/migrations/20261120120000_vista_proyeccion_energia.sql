-- Proyección de energía por local y periodo.
--
-- Para cada periodo P (AAAA-MM) y cada local con lectura en P-1:
--   kwh_promedio_6m  = promedio de kWh de las lecturas de P-6 .. P-1
--                      (los meses que existan; meses_con_lectura dice cuántos)
--   tarifa_kwh       = tarifa de la factura de energía de P-1 del grupo_energia
--                      del local (v2.facturas_energia)
--   total_proyectado = kwh_promedio_6m × tarifa_kwh, redondeado a múltiplos de
--                      $50 (misma regla que total_energia en lecturas_medidor)
--
-- Locales sin lectura en P-1 no se proyectan. Si falta la factura de P-1,
-- tarifa_kwh y total_proyectado quedan NULL.
-- Consumidores: /resumen (caja Luz, suma por periodo). Pensada también para
-- mostrar la proyección por local más adelante.

CREATE OR REPLACE VIEW v2.vista_proyeccion_energia
WITH (security_invoker = true) AS
WITH periodos AS (
  SELECT DISTINCT to_char(to_date(periodo, 'YYYY-MM') + interval '1 month', 'YYYY-MM') AS periodo
  FROM v2.lecturas_medidor
),
base AS (
  SELECT p.periodo, lm.empresa_id, lm.local_id,
         AVG(lm.kwh)  AS kwh_promedio,
         COUNT(*)     AS meses_con_lectura
  FROM periodos p
  JOIN v2.lecturas_medidor lm
    ON to_date(lm.periodo, 'YYYY-MM') >= to_date(p.periodo, 'YYYY-MM') - interval '6 months'
   AND to_date(lm.periodo, 'YYYY-MM') <  to_date(p.periodo, 'YYYY-MM')
  GROUP BY p.periodo, lm.empresa_id, lm.local_id
)
SELECT
  b.periodo,
  b.empresa_id,
  b.local_id,
  u.codigo,
  u.unidad,
  u.grupo_energia,
  ROUND(b.kwh_promedio, 2)                               AS kwh_promedio_6m,
  b.meses_con_lectura,
  fe.periodo                                             AS periodo_tarifa,
  fe.tarifa_kwh,
  ROUND(b.kwh_promedio * fe.tarifa_kwh / 50) * 50        AS total_proyectado
FROM base b
JOIN v2.locales u ON u.id = b.local_id
JOIN v2.lecturas_medidor ult
  ON ult.local_id = b.local_id
 AND ult.periodo  = to_char(to_date(b.periodo, 'YYYY-MM') - interval '1 month', 'YYYY-MM')
LEFT JOIN v2.facturas_energia fe
  ON fe.empresa_id    = b.empresa_id
 AND fe.grupo_energia = u.grupo_energia
 AND fe.periodo       = to_char(to_date(b.periodo, 'YYYY-MM') - interval '1 month', 'YYYY-MM');

COMMENT ON VIEW v2.vista_proyeccion_energia IS 'Proyección de energía por local y periodo: promedio kWh de los 6 meses anteriores × tarifa de la factura del mes anterior (grupo_energia), redondeado a $50.';
