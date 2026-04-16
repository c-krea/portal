import { db } from "@/lib/db/client"
import { sql } from "drizzle-orm"

const MONTH_LABELS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"]

export type AgingBucket = {
  bucket: string
  label: string
  count: number
  saldo: number
  valorVencido: number
  interesAcumulado: number
}

export type MonthlyCollection = {
  mes: string
  month: number
  recaudado: number
  count: number
}

export type ProyectadoVsReal = {
  mes: string
  month: number
  proyectado: number
  recaudado: number
  diferencia: number
}

export type ReporteSummary = {
  totalCartera: number
  totalVencido: number
  totalInteres: number
  totalRecaudado2026: number
}

export async function getAgingBuckets(): Promise<AgingBucket[]> {
  const rows = await db.execute(sql`
    SELECT
      CASE
        WHEN dias_mora <= 0  THEN '0'
        WHEN dias_mora <= 30 THEN '1_30'
        WHEN dias_mora <= 60 THEN '31_60'
        WHEN dias_mora <= 90 THEN '61_90'
        ELSE '90+'
      END AS bucket,
      COUNT(*)::int                              AS count,
      COALESCE(SUM(saldo), 0)::numeric           AS saldo,
      COALESCE(SUM(valor_vencido), 0)::numeric   AS valor_vencido,
      COALESCE(SUM(interes_acumulado), 0)::numeric AS interes_acumulado
    FROM cartera
    GROUP BY bucket
    ORDER BY bucket
  `)

  const ORDER = ["0", "1_30", "31_60", "61_90", "90+"]
  const LABELS: Record<string, string> = {
    "0":     "Al día",
    "1_30":  "1–30 días",
    "31_60": "31–60 días",
    "61_90": "61–90 días",
    "90+":   "90+ días",
  }

  return ORDER.map((bucket) => {
    const row = (rows as Array<Record<string, unknown>>).find((r) => String(r.bucket) === bucket)
    return {
      bucket,
      label:            LABELS[bucket],
      count:            Number(row?.count ?? 0),
      saldo:            Number(row?.saldo ?? 0),
      valorVencido:     Number(row?.valor_vencido ?? 0),
      interesAcumulado: Number(row?.interes_acumulado ?? 0),
    }
  })
}

export async function getMonthlyCollections(year = 2026): Promise<MonthlyCollection[]> {
  const rows = await db.execute(sql`
    SELECT
      EXTRACT(MONTH FROM fecha_recaudo)::int AS month,
      COALESCE(SUM(valor_final), 0)::numeric AS recaudado,
      COUNT(*)::int                          AS count
    FROM payments
    WHERE EXTRACT(YEAR FROM fecha_recaudo) = ${year}
      AND status != 'anulado'
    GROUP BY month
    ORDER BY month
  `)

  return MONTH_LABELS.map((label, i) => {
    const row = (rows as Array<Record<string, unknown>>).find((r) => Number(r.month) === i + 1)
    return {
      mes:       label,
      month:     i + 1,
      recaudado: Number(row?.recaudado ?? 0),
      count:     Number(row?.count ?? 0),
    }
  })
}

export async function getProyectadoVsReal(year = 2026): Promise<ProyectadoVsReal[]> {
  const [proyRows, recRows] = await Promise.all([
    db.execute(sql`
      SELECT
        month,
        COALESCE(SUM(canon_proyectado), 0)::numeric AS proyectado
      FROM projections
      WHERE year = ${year}
      GROUP BY month
      ORDER BY month
    `),
    db.execute(sql`
      SELECT
        EXTRACT(MONTH FROM fecha_recaudo)::int AS month,
        COALESCE(SUM(valor_final), 0)::numeric AS recaudado
      FROM payments
      WHERE EXTRACT(YEAR FROM fecha_recaudo) = ${year}
        AND status != 'anulado'
      GROUP BY month
      ORDER BY month
    `),
  ])

  return MONTH_LABELS.map((label, i) => {
    const m = i + 1
    const pRow = (proyRows as Array<Record<string, unknown>>).find((r) => Number(r.month) === m)
    const rRow = (recRows as Array<Record<string, unknown>>).find((r) => Number(r.month) === m)
    const proyectado = Number(pRow?.proyectado ?? 0)
    const recaudado  = Number(rRow?.recaudado ?? 0)
    return { mes: label, month: m, proyectado, recaudado, diferencia: recaudado - proyectado }
  })
}

export async function getReporteSummary(year = 2026): Promise<ReporteSummary> {
  const [carteraRow, pagosRow] = await Promise.all([
    db.execute(sql`
      SELECT
        COALESCE(SUM(saldo), 0)::numeric             AS total_cartera,
        COALESCE(SUM(valor_vencido), 0)::numeric     AS total_vencido,
        COALESCE(SUM(interes_acumulado), 0)::numeric AS total_interes
      FROM cartera
    `),
    db.execute(sql`
      SELECT COALESCE(SUM(valor_final), 0)::numeric AS total_recaudado
      FROM payments
      WHERE EXTRACT(YEAR FROM fecha_recaudo) = ${year}
        AND status != 'anulado'
    `),
  ])

  const c = (carteraRow as Array<Record<string, unknown>>)[0] ?? {}
  const p = (pagosRow  as Array<Record<string, unknown>>)[0] ?? {}
  return {
    totalCartera:      Number(c.total_cartera ?? 0),
    totalVencido:      Number(c.total_vencido ?? 0),
    totalInteres:      Number(c.total_interes ?? 0),
    totalRecaudado2026: Number(p.total_recaudado ?? 0),
  }
}
