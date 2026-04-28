/**
 * Invoice generation — DEPRECATED in v2 architecture.
 *
 * v2 derives facturas from siesa_raw (vista_facturas, read-only). Facturas are
 * generated in the Siesa ERP, not in the portal. This stub stays so the manual
 * "Generar facturas" button in /facturas doesn't break; Phase F removes the
 * legacy public.invoices table entirely.
 */

export type InvoicePeriod = { year: number; month: number }

export type GeneratedInvoice = {
  contractId: string
  tenantId: string
  unitId: string
  unitNumber: string
  clienteName: string
  periodo: string
  fechaEmision: string
  fechaVencimiento: string
  subtotalCanon: number
  subtotalDescuentos: number
  subtotalProntoPago: number
  subtotalGastos: number
  iva: number
  total: number
  status: "borrador"
}

export async function generateInvoicesForPeriod(
  _empresaId: string,
  _period: InvoicePeriod,
): Promise<{ created: number; skipped: number; errors: string[] }> {
  return { created: 0, skipped: 0, errors: [] }
}
