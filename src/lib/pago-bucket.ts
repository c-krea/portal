// Single home for the row-level bucket rule (the SQL CASE in
// getPagosBuckets in src/lib/data/pagos.ts mirrors it): mora by invoice age or
// grace period, else paid day 1-10 = temprano, rest = tardio.
//
// Dependency-free on purpose: both the server Resumen page and the "use client"
// pagos table import this, so it must not pull server-only modules (next/cache).
export type BucketRowLike = {
  invoicePeriodo: number | null
  diasMoraAlPago: number
  fechaRecaudo: string
}

export function classifyPagoBucket(
  p: BucketRowLike,
  gracePeriod: number,
  yyyymm: number,
): "temprano" | "tardio" | "mora" {
  if ((p.invoicePeriodo != null && p.invoicePeriodo < yyyymm) || p.diasMoraAlPago > gracePeriod)
    return "mora"
  const day = Number((p.fechaRecaudo ?? "").slice(8, 10))
  return day >= 1 && day <= 10 ? "temprano" : "tardio"
}
