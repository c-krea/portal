import { db } from "@/lib/db/client"
import { contracts, cartera } from "@/lib/db/schema"
import { sql, inArray, gt } from "drizzle-orm"
import { getProyectadoVsReal } from "@/lib/data/reportes"

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
  const rows = await db
    .select({
      totalMora: sql<string>`COALESCE(SUM(${cartera.valorVencido}), 0)`,
      totalSaldo: sql<string>`COALESCE(SUM(${cartera.saldo}), 0)`,
      totalInteres: sql<string>`COALESCE(SUM(${cartera.interesAcumulado}), 0)`,
      clientesEnMora: sql<number>`COUNT(DISTINCT ${cartera.tenantId})`,
      avgDiasMora: sql<string>`ROUND(AVG(NULLIF(${cartera.diasMora}, 0)), 0)`,
    })
    .from(cartera)
    .where(gt(cartera.valorVencido, "0"))

  return {
    totalMora: Number(rows[0]?.totalMora ?? 0),
    totalSaldo: Number(rows[0]?.totalSaldo ?? 0),
    totalInteres: Number(rows[0]?.totalInteres ?? 0),
    clientesEnMora: Number(rows[0]?.clientesEnMora ?? 0),
    avgDiasMora: Number(rows[0]?.avgDiasMora ?? 0),
  }
}

