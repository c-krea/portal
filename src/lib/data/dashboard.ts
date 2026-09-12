import { execute } from "@/lib/db/executor"
import { getIvaRate } from "@/lib/data/configuracion"
import { cached } from "@/lib/cache"

export const getPortfolioStats = cached(getPortfolioStats_uncached, ["dashboard:portfolio"], "dashboard")

async function getPortfolioStats_uncached(empresaId: string) {
  const iva = await getIvaRate()
  const [rows1, rows2, rows3] = await Promise.all([
    execute(`
      WITH base AS (
        SELECT
          COALESCE(o.precio,    0)::numeric           AS canon_mes,
          COALESCE(o.descuento, 0)::numeric / 100.0   AS dcto_pct,
          COALESCE(o.pronto_pago,0)::numeric / 100.0  AS pp_pct,
          COALESCE(i.tipo_persona,'PN')               AS tipo_persona,
          CASE
            WHEN c.fecha_inicio IS NULL OR c.fecha_inicio < DATE '2026-01-01' THEN 1
            WHEN c.fecha_inicio > DATE '2026-12-31' THEN 13
            ELSE EXTRACT(MONTH FROM c.fecha_inicio)::int
          END AS mes_start,
          CASE
            WHEN c.descuento_hasta_mes IS NULL THEN 13
            WHEN (c.fecha_inicio + (c.descuento_hasta_mes || ' months')::interval) < DATE '2026-01-01' THEN 0
            WHEN (c.fecha_inicio + (c.descuento_hasta_mes || ' months')::interval) > DATE '2026-12-31' THEN 13
            ELSE EXTRACT(MONTH FROM (c.fecha_inicio + (c.descuento_hasta_mes || ' months')::interval))::int
          END AS mes_dcto_end
        FROM siesa_raw.ocupacion o
        JOIN v2.inquilinos i ON i.nit = o.documento AND i.empresa_id = '${empresaId}'::uuid
        LEFT JOIN v2.locales l ON l.unidad = o.loc AND l.empresa_id = '${empresaId}'::uuid
        LEFT JOIN LATERAL (
          SELECT * FROM v2.contratos cc
          WHERE cc.local_id = l.id AND cc.inquilino_id = i.id
            AND cc.estado IN ('activo','critico')
          ORDER BY cc.fecha_inicio DESC NULLS LAST LIMIT 1
        ) c ON TRUE
        WHERE o.razon_social IS NOT NULL AND COALESCE(o.precio, 0) > 0
      ),
      expanded AS (
        SELECT
          b.canon_mes, b.dcto_pct, b.pp_pct, b.tipo_persona,
          CASE WHEN m.mes >= b.mes_start THEN 1 ELSE 0 END AS active,
          CASE WHEN m.mes >= b.mes_start AND m.mes <= b.mes_dcto_end THEN b.dcto_pct ELSE 0 END AS dcto_eff
        FROM base b CROSS JOIN generate_series(1,12) m(mes)
      )
      SELECT
        ROUND(COALESCE(SUM(
          canon_mes * (active - dcto_eff) * (1 - pp_pct)
          * ((1 + ${iva}) - CASE WHEN tipo_persona='PJ' THEN 0.035 ELSE 0 END)
        ), 0))::numeric AS piso_realista,
        ROUND(COALESCE(SUM(
          canon_mes * (active - dcto_eff)
          * ((1 + ${iva}) - CASE WHEN tipo_persona='PJ' THEN 0.035 ELSE 0 END)
        ), 0))::numeric AS techo_maximo
      FROM expanded
    `),
    execute(`
      SELECT COUNT(DISTINCT local_id)::int AS active_clients
      FROM v2.contratos
      WHERE estado IN ('activo', 'critico') AND empresa_id = '${empresaId}'
    `),
    execute(`
      SELECT COUNT(*)::int AS total_units
      FROM v2.locales
      WHERE empresa_id = '${empresaId}'
    `),
  ])

  return {
    portfolioTotal: Number(rows1[0]?.piso_realista ?? 0),
    portfolioTecho: Number(rows1[0]?.techo_maximo ?? 0),
    activeClients:  Number(rows2[0]?.active_clients ?? 0),
    totalUnits:     Number(rows3[0]?.total_units ?? 0),
  }
}
