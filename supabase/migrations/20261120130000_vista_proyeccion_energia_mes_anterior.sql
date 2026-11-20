-- Proyección de energía v2: lectura del mes anterior, con respaldo del mes previo.
-- Reemplaza la versión de promedio 6 meses (20261120120000).
--
-- Regla, por local, para el periodo P (mes del recaudo en /resumen):
--   kWh    = lectura de P-1; si aún no está registrada, la de P-2.
--   tarifa = factura de energía de P-1 del grupo_energia; si aún no existe, la de P-2.
--   total_proyectado = kWh × tarifa, redondeado a múltiplos de $50.
--   es_estimado = true si se usó P-2 en el kWh o en la tarifa.
--
-- Por qué: la luz que entra en el mes P paga las lecturas de P-1, pero esas
-- lecturas y la factura se registran hacia el día 9-10 de P. Antes de eso la
-- proyección usa P-2 en vez de quedar en $0. Desde que se registra P-1, el
-- proyectado es exactamente lo facturado. Un local sin lectura en P-1 sigue
-- proyectado con P-2 (queda marcado es_estimado).
--
-- kwh_promedio_6m / meses_con_lectura: informativos (promedio P-6..P-1).
-- DROP necesario: cambian las columnas respecto a la versión anterior.

DROP VIEW IF EXISTS v2.vista_proyeccion_energia;

CREATE VIEW v2.vista_proyeccion_energia
WITH (security_invoker = true) AS
WITH lm AS (
  SELECT empresa_id, local_id, periodo, kwh, to_date(periodo, 'YYYY-MM') AS mes
  FROM v2.lecturas_medidor
),
periodos AS (
  SELECT DISTINCT (mes + interval '1 month')::date AS mes FROM lm
  UNION
  SELECT DISTINCT (mes + interval '2 month')::date FROM lm
),
candidatos AS (
  -- locales con lectura en P-1 o P-2
  SELECT DISTINCT p.mes, lm.empresa_id, lm.local_id
  FROM periodos p
  JOIN lm ON lm.mes IN ((p.mes - interval '1 month')::date, (p.mes - interval '2 month')::date)
)
SELECT
  to_char(c.mes, 'YYYY-MM')                                   AS periodo,
  c.empresa_id,
  c.local_id,
  u.codigo,
  u.unidad,
  u.grupo_energia,
  COALESCE(l1.periodo, l2.periodo)                            AS periodo_lectura,
  COALESCE(l1.kwh, l2.kwh)                                    AS kwh,
  COALESCE(f1.periodo, f2.periodo)                            AS periodo_tarifa,
  COALESCE(f1.tarifa_kwh, f2.tarifa_kwh)                      AS tarifa_kwh,
  ROUND(COALESCE(l1.kwh, l2.kwh) * COALESCE(f1.tarifa_kwh, f2.tarifa_kwh) / 50) * 50
                                                              AS total_proyectado,
  (l1.local_id IS NULL OR f1.periodo IS NULL)                 AS es_estimado,
  h.kwh_promedio_6m,
  h.meses_con_lectura
FROM candidatos c
JOIN v2.locales u ON u.id = c.local_id
LEFT JOIN lm l1 ON l1.local_id = c.local_id AND l1.mes = (c.mes - interval '1 month')::date
LEFT JOIN lm l2 ON l2.local_id = c.local_id AND l2.mes = (c.mes - interval '2 month')::date
LEFT JOIN v2.facturas_energia f1
  ON f1.empresa_id = c.empresa_id AND f1.grupo_energia = u.grupo_energia
 AND f1.periodo = to_char(c.mes - interval '1 month', 'YYYY-MM')
LEFT JOIN v2.facturas_energia f2
  ON f2.empresa_id = c.empresa_id AND f2.grupo_energia = u.grupo_energia
 AND f2.periodo = to_char(c.mes - interval '2 month', 'YYYY-MM')
LEFT JOIN LATERAL (
  SELECT ROUND(AVG(h.kwh), 2) AS kwh_promedio_6m, COUNT(*) AS meses_con_lectura
  FROM lm h
  WHERE h.local_id = c.local_id
    AND h.mes >= (c.mes - interval '6 month')::date
    AND h.mes <  c.mes
) h ON true;

COMMENT ON VIEW v2.vista_proyeccion_energia IS 'Proyección de energía por local y periodo P: kWh de P-1 (o P-2 si aún no se registra) × tarifa de la factura de P-1 (o P-2), redondeado a $50. es_estimado marca el uso de P-2.';
