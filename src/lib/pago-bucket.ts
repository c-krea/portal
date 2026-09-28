// Single home for the row-level estado rule (the SQL CASE in
// getPagosBuckets in src/lib/data/pagos.ts mirrors it): Mora iff
// fecha_recaudo > fecha_factura + 30, else Al día.
//
// Dependency-free on purpose: both the server Resumen page and the "use client"
// pagos table import this, so it must not pull server-only modules (next/cache).
export type BucketRowLike = {
  fechaFactura: string | null
  fechaRecaudo: string
}

export type EstadoPago = "al_dia" | "mora"

function parseDay(s: string): number | null {
  const t = (s ?? "").slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null
  const y = Number(t.slice(0, 4))
  const m = Number(t.slice(5, 7))
  const d = Number(t.slice(8, 10))
  if (m < 1 || m > 12 || d < 1 || d > 31) return null
  return Date.UTC(y, m - 1, d)
}

export function classifyPagoBucket(p: BucketRowLike): EstadoPago {
  const f = parseDay(p.fechaFactura ?? "")
  const r = parseDay(p.fechaRecaudo ?? "")
  if (f == null || r == null) return "al_dia"
  return Math.round((r - f) / 86_400_000) > 30 ? "mora" : "al_dia"
}
