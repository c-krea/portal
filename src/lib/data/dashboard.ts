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
    execute(`
      SELECT ROUND(COALESCE(SUM(
        (p.canon_proyectado - p.descuento_proyectado)
        * (1 - (COALESCE(c.pronto_pago_pct, 0) / 100.0) * (COALESCE(t.pp_historico_pct, 0) / 100.0))
        * 1.19
      ), 0)) AS portfolio_total
      FROM v2.proyecciones p
      JOIN v2.contratos c ON p.contrato_id = c.id
      JOIN v2.inquilinos t ON c.inquilino_id = t.id
      WHERE p.anio = 2026
    `),
    execute(`SELECT COUNT(DISTINCT local_id)::int AS active_clients FROM v2.contratos WHERE estado IN ('activo', 'critico')`),
    execute(`SELECT COUNT(*)::int AS total_units FROM v2.locales`),
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
      COALESCE(SUM(vr_vencido), 0)::numeric                                             AS total_mora,
      COALESCE(SUM(saldo), 0)::numeric                                                  AS total_saldo,
      COUNT(DISTINCT inquilino_id)::int                                                 AS clientes_en_mora,
      ROUND(AVG(NULLIF(dias_mora, 0)), 0)::numeric                                      AS avg_dias_mora,
      COALESCE(SUM(CASE WHEN dias_mora > 60 THEN vr_vencido ELSE 0 END), 0)::numeric    AS mora_critica,
      COALESCE(SUM(CASE WHEN dias_mora BETWEEN ${grace + 1} AND 60 THEN vr_vencido ELSE 0 END), 0)::numeric AS mora_activa
    FROM v2.vista_cartera_actual
    WHERE vr_vencido > 0 AND dias_mora > ${grace}
      AND juridica = false
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
