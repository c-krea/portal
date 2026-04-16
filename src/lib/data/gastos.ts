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
  totalGastos: number
  totalAllocated: number
  totalPending: number
  countAllocated: number
  countPending: number
}

export async function getGastoRows(): Promise<GastoRow[]> {
  const rows = await execute(`
    SELECT
      g.id, g.periodo,
      gt.name                                     AS gasto_type_name,
      gt.category,
      gt.allocation_method,
      COALESCE(g.total_amount, 0)::numeric        AS total_amount,
      g.description,
      g.is_allocated
    FROM gastos g
    JOIN gasto_types gt ON gt.id = g.gasto_type_id
    ORDER BY g.periodo DESC, gt.category, gt.name
  `)
  return rows.map((r) => ({
    id: String(r.id),
    periodo: String(r.periodo),
    gastoTypeName: String(r.gasto_type_name),
    category: String(r.category),
    allocationMethod: String(r.allocation_method),
    totalAmount: Number(r.total_amount ?? 0),
    description: r.description ? String(r.description) : null,
    isAllocated: Boolean(r.is_allocated),
  }))
}

export async function getGastoSummary(): Promise<GastoSummary> {
  const rows = await execute(`
    SELECT
      COALESCE(SUM(total_amount), 0)::numeric                                     AS total_gastos,
      COALESCE(SUM(total_amount) FILTER (WHERE is_allocated = true), 0)::numeric  AS total_allocated,
      COALESCE(SUM(total_amount) FILTER (WHERE is_allocated = false), 0)::numeric AS total_pending,
      COUNT(*) FILTER (WHERE is_allocated = true)                                  AS count_allocated,
      COUNT(*) FILTER (WHERE is_allocated = false)                                 AS count_pending
    FROM gastos
  `)
  const r = rows[0]
  return {
    totalGastos: Number(r?.total_gastos ?? 0),
    totalAllocated: Number(r?.total_allocated ?? 0),
    totalPending: Number(r?.total_pending ?? 0),
    countAllocated: Number(r?.count_allocated ?? 0),
    countPending: Number(r?.count_pending ?? 0),
  }
}
