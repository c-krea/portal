/**
 * Payment reconciliation — DEPRECATED in v2 architecture.
 *
 * v2 derives cartera + pagos from siesa_raw via vistas (read-only). Reconciliation
 * happens in the ERP via Siesa's "Descuentos" pattern (RK-/CN- prefixed entries),
 * not in the portal. This function stays as a no-op so manual payment registration
 * still completes; Phase F removes payment_applications/invoices entirely.
 */

export type AllocationResult = {
  source: "cartera" | "invoice"
  id: string
  label: string | null
  amountApplied: number
  ppApplied: number
  saldoAfter: number
}

export type ReconciliationSummary = {
  totalApplied: number
  remainder: number
  allocations: AllocationResult[]
  itemsCleared: number
  ppTotal: number
}

export async function reconcilePayment(
  _tenantId: string,
  _paymentId: string,
  paymentAmount: number,
  _fechaRecaudo: string,
): Promise<ReconciliationSummary> {
  return {
    totalApplied: 0,
    remainder: paymentAmount,
    allocations: [],
    itemsCleared: 0,
    ppTotal: 0,
  }
}
