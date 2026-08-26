import { execute } from "@/lib/db/executor"
import { getProyectadoVsReal } from "@/lib/data/reportes"
import { getGracePeriod } from "@/lib/data/configuracion"
import { getEmpresaCkreaId } from "@/lib/empresa"
import { cached } from "@/lib/cache"

async function getDashboardData_uncached() {
  const empresaId = await getEmpresaCkreaId()
  const [portfolio, mora, totalRecaudado, chart] = await Promise.all([
    getPortfolioStats(empresaId),
    getMoraStats(empresaId),
    getTotalRecaudado(empresaId, 2026),
    getProyectadoVsReal(2026),
  ])
  return { portfolio, mora, totalRecaudado, chart, computedAt: new Date().toISOString() }
}

// Cached (30-min window; busts via ERP sync + financial-rule edits)
export const getDashboardData = cached(getDashboardData_uncached, ["dashboard"], "dashboard")

async function getPortfolioStats(empresaId: string) {
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
          * (1.19 - CASE WHEN tipo_persona='PJ' THEN 0.035 ELSE 0 END)
        ), 0))::numeric AS piso_realista,
        ROUND(COALESCE(SUM(
          canon_mes * (active - dcto_eff)
          * (1.19 - CASE WHEN tipo_persona='PJ' THEN 0.035 ELSE 0 END)
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

async function getTotalRecaudado(empresaId: string, year: number) {
  const rows = await execute(`
    WITH vp AS MATERIALIZED (
      SELECT * FROM v2.vista_pagos
      WHERE EXTRACT(YEAR FROM fecha_recaudo) = ${year}
        AND empresa_id = '${empresaId}'
    )
    SELECT
      COALESCE(SUM(valor_final), 0)::numeric          AS recaudado,
      COALESCE(SUM(pronto_pago_aplicado), 0)::numeric AS pp_otorgado
    FROM vp
  `)
  const r = (rows as Array<Record<string, unknown>>)[0] ?? {}
  return {
    recaudado:  Number(r.recaudado ?? 0),
    ppOtorgado: Number(r.pp_otorgado ?? 0),
  }
}

async function getMoraStats(empresaId: string) {
  const grace = await getGracePeriod()

  const rows = await execute(`
    SELECT
      COALESCE(SUM(vr_vencido), 0)::numeric                                             AS total_mora,
      COALESCE(SUM(saldo), 0)::numeric                                                  AS total_saldo,
      COUNT(DISTINCT inquilino_id)::int                                                 AS clientes_en_mora,
      ROUND(AVG(NULLIF(dias_mora, 0)), 0)::numeric                                      AS avg_dias_mora,
      COALESCE(SUM(CASE WHEN dias_mora > 60 THEN vr_vencido ELSE 0 END), 0)::numeric    AS mora_critica,
      COALESCE(SUM(CASE WHEN dias_mora BETWEEN ${grace + 1} AND 60 THEN vr_vencido ELSE 0 END), 0)::numeric AS mora_activa
    FROM v2.vista_cartera_actual
    WHERE vr_vencido > 0 AND dias_mora > ${grace}
      AND juridica = false
      AND empresa_id = '${empresaId}'
  `)

  const r = (rows as Array<Record<string, unknown>>)[0] ?? {}
  return {
    totalMora:       Number(r.total_mora ?? 0),
    totalSaldo:      Number(r.total_saldo ?? 0),
    totalInteres:    0,
    clientesEnMora:  Number(r.clientes_en_mora ?? 0),
    avgDiasMora:     Number(r.avg_dias_mora ?? 0),
    moraCritica:     Number(r.mora_critica ?? 0),
    moraActiva:      Number(r.mora_activa ?? 0),
  }
}
