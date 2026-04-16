import { db } from "@/lib/db/client"
import { contracts } from "@/lib/db/schema"
import { sql, inArray } from "drizzle-orm"
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
  const [projRow, clientRow] = await Promise.all([
    db.execute(sql`
      SELECT ROUND(
        COALESCE(SUM(canon_proyectado - descuento_proyectado - pronto_pago_proyectado), 0) * 1.19
      ) AS portfolio_total
      FROM projections
      WHERE year = 2026
    `),
    db
      .select({ activeClients: sql<number>`COUNT(DISTINCT ${contracts.tenantId})` })
      .from(contracts)
      .where(inArray(contracts.status, ["activo", "critico"])),
  ])

  return {
    portfolioTotal: Number((projRow as Array<Record<string, unknown>>)[0]?.portfolio_total ?? 0),
    activeClients: Number(clientRow[0]?.activeClients ?? 0),
  }
}

async function getMoraStats() {
  const grace = await getGracePeriod()

  const rows = await db.execute(sql`
    SELECT
      COALESCE(SUM(valor_vencido), 0)::numeric          AS total_mora,
      COALESCE(SUM(saldo), 0)::numeric                  AS total_saldo,
      COALESCE(SUM(interes_acumulado), 0)::numeric      AS total_interes,
      COUNT(DISTINCT tenant_id)::int                    AS clientes_en_mora,
      ROUND(AVG(NULLIF(dias_mora, 0)), 0)::numeric      AS avg_dias_mora
    FROM cartera
    WHERE valor_vencido > 0 AND dias_mora > ${grace}
  `)

  const r = (rows as Array<Record<string, unknown>>)[0] ?? {}
  return {
    totalMora:       Number(r.total_mora ?? 0),
    totalSaldo:      Number(r.total_saldo ?? 0),
    totalInteres:    Number(r.total_interes ?? 0),
    clientesEnMora:  Number(r.clientes_en_mora ?? 0),
    avgDiasMora:     Number(r.avg_dias_mora ?? 0),
  }
}

