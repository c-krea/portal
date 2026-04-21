import { execute } from "@/lib/db/executor"
import { getGracePeriod } from "@/lib/data/configuracion"

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
  recaudado: number        // total collected for this invoice month (atTiempo + vencido)
  recaudadoATiempo: number // paid on time (RECAUDADO clasificacion)
  recaudadoVencido: number // paid late for this invoice month (VENCIDO clasificacion)
  ppOtorgado: number
  pendiente: number
  recaudadoCash: number    // cash actually received this calendar month (by fecha_recaudo)
  diferencia: number
}

export type ReporteSummary = {
  totalCartera: number
  totalVencido: number
  totalInteres: number
  totalRecaudado2026: number
}

export async function getAgingBuckets(): Promise<AgingBucket[]> {
  const rows = await execute(`
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
    WHERE saldo > 0
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
  const rows = await execute(`
    SELECT
      EXTRACT(MONTH FROM fecha_recaudo)::int AS month,
      COALESCE(SUM(valor_final), 0)::numeric AS recaudado,
      COUNT(*)::int                          AS count
    FROM payments
    WHERE EXTRACT(YEAR FROM fecha_recaudo) = ${year}
      AND siesa_clasificacion IN ('RECAUDADO', 'VENCIDO')
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
  const [proyRows, invRows, cashRows] = await Promise.all([
    execute(`
      SELECT
        month,
        ROUND(COALESCE(SUM(canon_proyectado - descuento_proyectado), 0) * 1.19)::numeric AS proyectado
      FROM projections
      WHERE year = ${year}
      GROUP BY month
      ORDER BY month
    `),
    // Invoice basis: group by the month the invoice belongs to (fecha_factura)
    execute(`
      SELECT
        EXTRACT(MONTH FROM fecha_factura)::int AS month,
        COALESCE(SUM(valor_final) FILTER (WHERE siesa_clasificacion = 'RECAUDADO'), 0)::numeric AS recaudado_a_tiempo,
        COALESCE(SUM(valor_final) FILTER (WHERE siesa_clasificacion = 'VENCIDO'),   0)::numeric AS recaudado_vencido,
        COALESCE(SUM(pronto_pago_aplicado), 0)::numeric AS pp_otorgado
      FROM payments
      WHERE EXTRACT(YEAR FROM fecha_factura) = ${year}
        AND siesa_clasificacion IN ('RECAUDADO', 'VENCIDO')
      GROUP BY month
      ORDER BY month
    `),
    // Cash basis: group by when cash was actually received (fecha_recaudo)
    execute(`
      SELECT
        EXTRACT(MONTH FROM fecha_recaudo)::int         AS month,
        COALESCE(SUM(valor_final), 0)::numeric         AS recaudado_cash
      FROM payments
      WHERE EXTRACT(YEAR FROM fecha_recaudo) = ${year}
        AND siesa_clasificacion IN ('RECAUDADO', 'VENCIDO')
      GROUP BY month
      ORDER BY month
    `),
  ])

  return MONTH_LABELS.map((label, i) => {
    const m = i + 1
    const pRow    = (proyRows  as Array<Record<string, unknown>>).find((r) => Number(r.month) === m)
    const iRow    = (invRows   as Array<Record<string, unknown>>).find((r) => Number(r.month) === m)
    const cRow    = (cashRows  as Array<Record<string, unknown>>).find((r) => Number(r.month) === m)
    const proyectado       = Number(pRow?.proyectado          ?? 0)
    const recaudadoATiempo = Number(iRow?.recaudado_a_tiempo  ?? 0)
    const recaudadoVencido = Number(iRow?.recaudado_vencido   ?? 0)
    const ppOtorgado       = Number(iRow?.pp_otorgado         ?? 0)
    const recaudadoCash    = Number(cRow?.recaudado_cash      ?? 0)
    const recaudado        = recaudadoATiempo + recaudadoVencido
    const pendiente        = Math.max(proyectado - recaudado - ppOtorgado, 0)
    return { mes: label, month: m, proyectado, recaudado, recaudadoATiempo, recaudadoVencido, ppOtorgado, pendiente, recaudadoCash, diferencia: recaudado - proyectado }
  })
}

export async function getReporteSummary(year = 2026): Promise<ReporteSummary> {
  const grace = await getGracePeriod()

  const [carteraRow, pagosRow] = await Promise.all([
    execute(`
      SELECT
        COALESCE(SUM(saldo) FILTER (WHERE saldo > 0), 0)::numeric AS total_cartera,
        COALESCE(SUM(valor_vencido) FILTER (WHERE dias_mora > ${grace}), 0)::numeric AS total_vencido,
        COALESCE(SUM(interes_acumulado), 0)::numeric AS total_interes
      FROM cartera
    `),
    execute(`
      SELECT COALESCE(SUM(valor_final), 0)::numeric AS total_recaudado
      FROM payments
      WHERE EXTRACT(YEAR FROM fecha_recaudo) = ${year}
        AND siesa_clasificacion IN ('RECAUDADO', 'VENCIDO')
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
