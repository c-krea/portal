import { execute } from "@/lib/db/executor"

export type GastoRow = {
  id: string
  periodo: string
  gastoTypeName: string
  category: string
  allocationMethod: string
  totalAmount: number
  description: string | null
  isAllocated: boolean
}

export type GastoSummary = {
  totalYtd: number
  avgMensual: number
  totalMeses: number
  lastPeriodo: string
  lastTotal: number
}

export type GastoChartRow = {
  periodo: string
  vigilancia: number
  reparaciones: number
  nomina: number
  servicios_publicos: number
  aseo_cafeteria: number
  publicidad: number
  impuestos: number
  otros: number
  total: number
}

export async function getGastoRows(periodo?: string): Promise<GastoRow[]> {
  const rows = await execute(`
    SELECT
      g.id, g.periodo,
      gt.nombre                                   AS gasto_type_name,
      gt.categoria                                AS category,
      gt.metodo_asignacion                        AS allocation_method,
      COALESCE(g.monto_total, 0)::numeric         AS total_amount,
      g.descripcion                               AS description
    FROM v2.gastos g
    JOIN v2.tipos_gasto gt ON gt.id = g.tipo_gasto_id
    ${periodo ? `WHERE g.periodo = '${periodo}'` : ""}
    ORDER BY g.periodo DESC, gt.categoria, gt.nombre
  `)
  return rows.map((r) => ({
    id: String(r.id),
    periodo: String(r.periodo),
    gastoTypeName: String(r.gasto_type_name),
    category: String(r.category),
    allocationMethod: String(r.allocation_method),
    totalAmount: Number(r.total_amount ?? 0),
    description: r.description ? String(r.description) : null,
    isAllocated: false,
  }))
}

export async function getGastoSummary(): Promise<GastoSummary> {
  const rows = await execute(`
    WITH monthly AS (
      SELECT periodo, SUM(monto_total)::numeric AS total
      FROM v2.gastos GROUP BY periodo
    )
    SELECT
      SUM(total)::numeric                          AS total_ytd,
      ROUND(AVG(total), 0)::numeric                AS avg_mensual,
      COUNT(*)::int                                AS total_meses,
      (SELECT periodo FROM monthly ORDER BY periodo DESC LIMIT 1) AS last_periodo,
      (SELECT total  FROM monthly ORDER BY periodo DESC LIMIT 1) AS last_total
    FROM monthly
  `)
  const r = rows[0] as Record<string, unknown>
  return {
    totalYtd:    Number(r?.total_ytd   ?? 0),
    avgMensual:  Number(r?.avg_mensual ?? 0),
    totalMeses:  Number(r?.total_meses ?? 0),
    lastPeriodo: String(r?.last_periodo ?? ''),
    lastTotal:   Number(r?.last_total  ?? 0),
  }
}

const MES_LABEL: Record<string, string> = {
  '2026-01': 'Ene', '2026-02': 'Feb', '2026-03': 'Mar',
  '2026-04': 'Abr', '2026-05': 'May', '2026-06': 'Jun',
  '2026-07': 'Jul', '2026-08': 'Ago', '2026-09': 'Sep',
  '2026-10': 'Oct', '2026-11': 'Nov', '2026-12': 'Dic',
}

export async function getGastosForPeriodo(periodo: string): Promise<GastoChartRow> {
  const rows = await execute(`
    SELECT
      g.periodo,
      COALESCE(SUM(g.monto_total) FILTER (WHERE gt.categoria = 'vigilancia'),        0)::numeric AS vigilancia,
      COALESCE(SUM(g.monto_total) FILTER (WHERE gt.categoria = 'reparaciones'),      0)::numeric AS reparaciones,
      COALESCE(SUM(g.monto_total) FILTER (WHERE gt.categoria = 'nomina'),            0)::numeric AS nomina,
      COALESCE(SUM(g.monto_total) FILTER (WHERE gt.categoria = 'servicios_publicos'),0)::numeric AS servicios_publicos,
      COALESCE(SUM(g.monto_total) FILTER (WHERE gt.categoria = 'aseo_cafeteria'),    0)::numeric AS aseo_cafeteria,
      COALESCE(SUM(g.monto_total) FILTER (WHERE gt.categoria = 'publicidad'),        0)::numeric AS publicidad,
      COALESCE(SUM(g.monto_total) FILTER (WHERE gt.categoria = 'impuestos'),         0)::numeric AS impuestos,
      COALESCE(SUM(g.monto_total) FILTER (WHERE gt.categoria = 'otros'),             0)::numeric AS otros,
      COALESCE(SUM(g.monto_total),                                                   0)::numeric AS total
    FROM v2.gastos g
    JOIN v2.tipos_gasto gt ON gt.id = g.tipo_gasto_id
    WHERE g.periodo = '${periodo}'
    GROUP BY g.periodo
  `)
  if (!rows.length) {
    return { periodo: MES_LABEL[periodo] ?? periodo, vigilancia: 0, reparaciones: 0, nomina: 0, servicios_publicos: 0, aseo_cafeteria: 0, publicidad: 0, impuestos: 0, otros: 0, total: 0 }
  }
  const r = rows[0] as Record<string, unknown>
  return {
    periodo:            MES_LABEL[String(r.periodo)] ?? String(r.periodo),
    vigilancia:         Number(r.vigilancia         ?? 0),
    reparaciones:       Number(r.reparaciones       ?? 0),
    nomina:             Number(r.nomina             ?? 0),
    servicios_publicos: Number(r.servicios_publicos ?? 0),
    aseo_cafeteria:     Number(r.aseo_cafeteria     ?? 0),
    publicidad:         Number(r.publicidad         ?? 0),
    impuestos:          Number(r.impuestos          ?? 0),
    otros:              Number(r.otros              ?? 0),
    total:              Number(r.total              ?? 0),
  }
}
