import { db } from "@/lib/db/client"
import { contracts, cartera, projections } from "@/lib/db/schema"
import { sql, inArray, gt } from "drizzle-orm"

const MONTH_LABELS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"]

export async function getDashboardData() {
  const [portfolio, mora, chart] = await Promise.all([
    getPortfolioStats(),
    getMoraStats(),
    getMonthlyProjections(),
  ])
  return { portfolio, mora, chart }
}

async function getPortfolioStats() {
  const rows = await db
    .select({
      portfolioTotal: sql<string>`COALESCE(SUM(${contracts.canonBase}), 0)`,
      activeClients: sql<number>`COUNT(DISTINCT ${contracts.tenantId})`,
    })
    .from(contracts)
    .where(inArray(contracts.status, ["activo", "critico"]))

  return {
    portfolioTotal: Number(rows[0]?.portfolioTotal ?? 0),
    activeClients: Number(rows[0]?.activeClients ?? 0),
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

async function getMonthlyProjections() {
  const rows = await db
    .select({
      month: projections.month,
      proyectado: sql<string>`COALESCE(SUM(${projections.canonProyectado}), 0)`,
    })
    .from(projections)
    .where(sql`${projections.year} = 2026`)
    .groupBy(projections.month)
    .orderBy(projections.month)

  return MONTH_LABELS.map((label, i) => {
    const row = rows.find((r) => r.month === i + 1)
    return {
      mes: label,
      proyectado: Number(row?.proyectado ?? 0),
      recibido: 0,
    }
  })
}
