import { execute } from "@/lib/db/executor"
import { getProyectadoVsReal } from "@/lib/data/reportes"
import { getGracePeriod } from "@/lib/data/configuracion"

export async function getDashboardData() {
  const [portfolio, mora, chart] = await Promise.all([
    getPortfolioStats(),
    getMoraStats(),
    getProyectadoVsReal(2026),
  ])
  return { portfolio, mora, chart }
}

async function getPortfolioStats() {
  const [rows1, rows2, rows3] = await Promise.all([
    execute(`SELECT ROUND(COALESCE(SUM(canon_proyectado - descuento_proyectado), 0) * 1.19) AS portfolio_total FROM projections WHERE year = 2026`),
    execute(`SELECT COUNT(DISTINCT unit_id)::int AS active_clients FROM contracts WHERE status IN ('activo', 'critico')`),
    execute(`SELECT COUNT(*)::int AS total_units FROM units`),
  ])

  return {
    portfolioTotal: Number(rows1[0]?.portfolio_total ?? 0),
    activeClients: Number(rows2[0]?.active_clients ?? 0),
    totalUnits: Number(rows3[0]?.total_units ?? 0),
  }
}

async function getMoraStats() {
  const grace = await getGracePeriod()

  const rows = await execute(`
    SELECT
      COALESCE(SUM(valor_vencido), 0)::numeric                                          AS total_mora,
      COALESCE(SUM(saldo), 0)::numeric                                                  AS total_saldo,
      COALESCE(SUM(interes_acumulado), 0)::numeric                                      AS total_interes,
      COUNT(DISTINCT tenant_id)::int                                                    AS clientes_en_mora,
      ROUND(AVG(NULLIF(dias_mora, 0)), 0)::numeric                                      AS avg_dias_mora,
      COALESCE(SUM(CASE WHEN dias_mora > 60 THEN valor_vencido ELSE 0 END), 0)::numeric AS mora_critica,
      COALESCE(SUM(CASE WHEN dias_mora BETWEEN ${grace + 1} AND 60 THEN valor_vencido ELSE 0 END), 0)::numeric AS mora_activa
    FROM cartera
    WHERE valor_vencido > 0 AND dias_mora > ${grace}
      AND tenant_id NOT IN (SELECT id FROM tenants WHERE juridica = true)
  `)

  const r = (rows as Array<Record<string, unknown>>)[0] ?? {}
  return {
    totalMora:       Number(r.total_mora ?? 0),
    totalSaldo:      Number(r.total_saldo ?? 0),
    totalInteres:    Number(r.total_interes ?? 0),
    clientesEnMora:  Number(r.clientes_en_mora ?? 0),
    avgDiasMora:     Number(r.avg_dias_mora ?? 0),
    moraCritica:     Number(r.mora_critica ?? 0),
    moraActiva:      Number(r.mora_activa ?? 0),
  }
}
