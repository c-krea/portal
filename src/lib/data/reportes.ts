import { execute } from "@/lib/db/executor"
import { getGracePeriod } from "@/lib/data/configuracion"
import { getEmpresaCkreaId } from "@/lib/empresa"

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
  proyectado: number    // = piso (realistic floor); kept for back-compat with chart
  piso: number          // gross − phase − PP (per contract) + IVA: realistic floor
  techo: number         // gross − phase + IVA: theoretical max if nobody takes PP
  recaudado: number
  ppOtorgado: number
  pendiente: number
  diferencia: number
}

export type ReporteSummary = {
  totalCartera: number
  totalVencido: number
  totalInteres: number
  totalRecaudado2026: number
}

export async function getAgingBuckets(): Promise<AgingBucket[]> {
  const empresaId = await getEmpresaCkreaId()
  const rows = await execute(`
    SELECT
      CASE
        WHEN dias_mora <= 0  THEN '0'
        WHEN dias_mora <= 30 THEN '1_30'
        WHEN dias_mora <= 60 THEN '31_60'
        ELSE 'critica'
      END AS bucket,
      COUNT(*)::int                              AS count,
      COALESCE(SUM(saldo), 0)::numeric           AS saldo,
      COALESCE(SUM(vr_vencido), 0)::numeric      AS valor_vencido
    FROM v2.vista_cartera_actual
    WHERE saldo > 0
      AND empresa_id = '${empresaId}'
      AND juridica = false
    GROUP BY bucket
    ORDER BY bucket
  `)

  const ORDER = ["0", "1_30", "31_60", "critica"]
  const LABELS: Record<string, string> = {
    "0":       "Al día",
    "1_30":    "1–30 días",
    "31_60":   "31–60 días",
    "critica": "Más de 60 días",
  }

  return ORDER.map((bucket) => {
    const row = (rows as Array<Record<string, unknown>>).find((r) => String(r.bucket) === bucket)
    return {
      bucket,
      label:            LABELS[bucket],
      count:            Number(row?.count ?? 0),
      saldo:            Number(row?.saldo ?? 0),
      valorVencido:     Number(row?.valor_vencido ?? 0),
      interesAcumulado: 0,
    }
  })
}

export async function getMonthlyCollections(year = 2026): Promise<MonthlyCollection[]> {
  const empresaId = await getEmpresaCkreaId()
  const rows = await execute(`
    SELECT
      EXTRACT(MONTH FROM fecha_recaudo)::int AS month,
      COALESCE(SUM(valor_final), 0)::numeric AS recaudado,
      COUNT(*)::int                          AS count
    FROM v2.vista_pagos
    WHERE EXTRACT(YEAR FROM fecha_recaudo) = ${year}
      AND empresa_id = '${empresaId}'
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
  const empresaId = await getEmpresaCkreaId()
  const [proyRows, recRows] = await Promise.all([
    execute(`
      SELECT
        p.mes AS month,
        ROUND(COALESCE(SUM(
          (p.canon_proyectado - p.descuento_proyectado)
          * (1 - COALESCE(c.pronto_pago_pct, 0) / 100.0)
          * 1.19
        ), 0))::numeric AS piso,
        ROUND(COALESCE(SUM(
          (p.canon_proyectado - p.descuento_proyectado) * 1.19
        ), 0))::numeric AS techo
      FROM v2.proyecciones p
      JOIN v2.contratos c ON p.contrato_id = c.id
      WHERE p.anio = ${year}
        AND p.empresa_id = '${empresaId}'
      GROUP BY p.mes
      ORDER BY p.mes
    `),
    execute(`
      SELECT
        EXTRACT(MONTH FROM fecha_recaudo)::int          AS month,
        COALESCE(SUM(valor_final), 0)::numeric          AS recaudado,
        COALESCE(SUM(pronto_pago_aplicado), 0)::numeric AS pp_otorgado
      FROM v2.vista_pagos
      WHERE EXTRACT(YEAR FROM fecha_recaudo) = ${year}
        AND empresa_id = '${empresaId}'
      GROUP BY month
      ORDER BY month
    `),
  ])

  return MONTH_LABELS.map((label, i) => {
    const m = i + 1
    const pRow = (proyRows as Array<Record<string, unknown>>).find((r) => Number(r.month) === m)
    const rRow = (recRows  as Array<Record<string, unknown>>).find((r) => Number(r.month) === m)
    const piso       = Number(pRow?.piso        ?? 0)
    const techo      = Number(pRow?.techo       ?? 0)
    const recaudado  = Number(rRow?.recaudado   ?? 0)
    const ppOtorgado = Number(rRow?.pp_otorgado ?? 0)
    const pendiente  = Math.max(piso - recaudado - ppOtorgado, 0)
    return {
      mes: label, month: m,
      proyectado: piso,
      piso, techo,
      recaudado, ppOtorgado, pendiente,
      diferencia: recaudado - piso,
    }
  })
}

export async function getReporteSummary(year = 2026): Promise<ReporteSummary> {
  const empresaId = await getEmpresaCkreaId()
  const grace = await getGracePeriod()

  const [carteraRow, pagosRow] = await Promise.all([
    execute(`
      SELECT
        COALESCE(SUM(saldo) FILTER (WHERE saldo > 0), 0)::numeric AS total_cartera,
        COALESCE(SUM(vr_vencido) FILTER (WHERE dias_mora > ${grace}), 0)::numeric AS total_vencido
      FROM v2.vista_cartera_actual
      WHERE empresa_id = '${empresaId}'
        AND juridica = false
    `),
    execute(`
      SELECT COALESCE(SUM(valor_final), 0)::numeric AS total_recaudado
      FROM v2.vista_pagos
      WHERE EXTRACT(YEAR FROM fecha_recaudo) = ${year}
        AND empresa_id = '${empresaId}'
    `),
  ])

  const c = (carteraRow as Array<Record<string, unknown>>)[0] ?? {}
  const p = (pagosRow  as Array<Record<string, unknown>>)[0] ?? {}
  return {
    totalCartera:      Number(c.total_cartera ?? 0),
    totalVencido:      Number(c.total_vencido ?? 0),
    totalInteres:      0,
    totalRecaudado2026: Number(p.total_recaudado ?? 0),
  }
}
