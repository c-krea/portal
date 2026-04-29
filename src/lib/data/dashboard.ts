import { execute } from "@/lib/db/executor"
import { getProyectadoVsReal } from "@/lib/data/reportes"
import { getGracePeriod } from "@/lib/data/configuracion"
import { getEmpresaCkreaId } from "@/lib/empresa"

export async function getDashboardData() {
  const empresaId = await getEmpresaCkreaId()
  const [portfolio, mora, totalRecaudado, chart] = await Promise.all([
    getPortfolioStats(empresaId),
    getMoraStats(empresaId),
    getTotalRecaudado(empresaId, 2026),
    getProyectadoVsReal(2026),
  ])
  return { portfolio, mora, totalRecaudado, chart }
}

async function getPortfolioStats(empresaId: string) {
  const [rows1, rows2, rows3] = await Promise.all([
    execute(`
      SELECT
        ROUND(COALESCE(SUM(
          (p.canon_proyectado - p.descuento_proyectado)
          * (1 - COALESCE(c.pronto_pago_pct, 0) / 100.0)
          * 1.19
        ), 0))::numeric AS piso_realista,
        ROUND(COALESCE(SUM(
          (p.canon_proyectado - p.descuento_proyectado) * 1.19
        ), 0))::numeric AS techo_maximo
      FROM v2.proyecciones p
      JOIN v2.contratos c ON p.contrato_id = c.id
      WHERE p.anio = 2026 AND p.empresa_id = '${empresaId}'
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
    SELECT
      COALESCE(SUM(valor_final), 0)::numeric          AS recaudado,
      COALESCE(SUM(pronto_pago_aplicado), 0)::numeric AS pp_otorgado
    FROM v2.vista_pagos
    WHERE EXTRACT(YEAR FROM fecha_recaudo) = ${year}
      AND empresa_id = '${empresaId}'
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
