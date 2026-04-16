/**
 * Payment reconciliation — FIFO allocation against open cartera + portal invoices.
 *
 * Two debt sources:
 *   1. cartera — Siesa snapshot (historical/imported receivables)
 *   2. invoices — portal-generated invoices (borrador/emitida/parcial)
 *
 * Order: oldest fecha_factura/fecha_emision first across both sources (FIFO).
 * PP: if payment date ≤ invoice.fecha_pronto_pago → deduct subtotal_pronto_pago from saldo.
 */

import { execute, supabaseAdmin } from "@/lib/db/executor"

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
  tenantId: string,
  paymentId: string,
  paymentAmount: number,
  fechaRecaudo: string,
): Promise<ReconciliationSummary> {
  // 1. Open portal invoices (borrador/emitida/parcial/vencida), oldest first
  const openInvoicesRows = await execute(`
    SELECT
      id,
      periodo,
      fecha_emision,
      fecha_pronto_pago,
      subtotal_pronto_pago::numeric AS subtotal_pronto_pago,
      subtotal_interes::numeric     AS subtotal_interes,
      saldo::numeric                AS saldo,
      status
    FROM invoices
    WHERE tenant_id = '${tenantId}'::uuid
      AND (saldo::numeric > 0 OR subtotal_interes::numeric > 0)
      AND status IN ('borrador', 'emitida', 'parcial', 'vencida')
    ORDER BY fecha_emision ASC
  `)

  // 2. Open cartera (Siesa snapshot), oldest first
  const openCarteraRows = await execute(`
    SELECT
      id,
      siesa_factura,
      fecha_factura,
      saldo::numeric        AS saldo,
      valor_vencido::numeric AS valor_vencido
    FROM cartera
    WHERE tenant_id = '${tenantId}'::uuid AND saldo::numeric > 0
    ORDER BY fecha_factura ASC NULLS LAST
  `)

  const openInvoices = openInvoicesRows as Array<Record<string, unknown>>
  const openCartera = openCarteraRows as Array<Record<string, unknown>>

  let remaining = paymentAmount
  const allocations: AllocationResult[] = []
  let ppTotal = 0

  // Apply to portal invoices first (PP logic + interest first per spec §9.10)
  for (const inv of openInvoices) {
    if (remaining <= 0) break

    const currentSaldo = Number(inv.saldo)
    const currentInteres = Number(inv.subtotal_interes ?? 0)
    const ppRef = Number(inv.subtotal_pronto_pago ?? 0)

    // Check if payment is within pronto pago window
    const withinPP =
      ppRef > 0 &&
      inv.fecha_pronto_pago != null &&
      fechaRecaudo <= String(inv.fecha_pronto_pago)

    // Spec §9.10: apply to accrued interest first, then principal
    // Apply payment to interest portion first
    const interestCovered = Math.min(remaining, currentInteres)
    remaining -= interestCovered
    const newInteres = Math.max(0, currentInteres - interestCovered)

    // Then apply to principal (with PP if eligible)
    const effectiveSaldo = withinPP ? Math.max(0, currentSaldo - ppRef) : currentSaldo
    const principalApplied = Math.min(remaining, effectiveSaldo > 0 ? effectiveSaldo : currentSaldo)

    const ppApplied = withinPP && principalApplied >= effectiveSaldo ? ppRef : 0
    const newSaldo = Math.max(0, currentSaldo - principalApplied - ppApplied)

    const totalAppliedThisInvoice = interestCovered + principalApplied

    // Determine new status
    const newStatus = newSaldo === 0 && newInteres === 0 ? "pagada" : "parcial"

    const { error: updateError } = await supabaseAdmin
      .from("invoices")
      .update({
        saldo:            String(Math.round(newSaldo)),
        subtotal_interes: String(Math.round(newInteres)),
        status:           newStatus,
      })
      .eq("id", String(inv.id))
    if (updateError) throw new Error(updateError.message)

    // Insert payment_application record
    const { error: appError } = await supabaseAdmin
      .from("payment_applications")
      .insert({
        payment_id:     paymentId,
        invoice_id:     String(inv.id),
        amount_applied: String(Math.round(totalAppliedThisInvoice + ppApplied)),
      })
    if (appError) throw new Error(appError.message)

    allocations.push({
      source: "invoice",
      id: String(inv.id),
      label: `Factura ${String(inv.periodo)}`,
      amountApplied: totalAppliedThisInvoice,
      ppApplied,
      saldoAfter: newSaldo,
    })

    ppTotal += ppApplied
    remaining -= principalApplied
  }

  // Apply remainder to cartera (Siesa snapshot)
  for (const item of openCartera) {
    if (remaining <= 0) break

    const currentSaldo = Number(item.saldo)
    const currentVencido = Number(item.valor_vencido ?? 0)
    const applied = Math.min(remaining, currentSaldo)

    const newSaldo = Math.max(0, currentSaldo - applied)
    const newVencido = Math.max(0, currentVencido - applied)

    const { error: updateError } = await supabaseAdmin
      .from("cartera")
      .update({
        saldo:         String(newSaldo.toFixed(2)),
        valor_vencido: String(newVencido.toFixed(2)),
      })
      .eq("id", String(item.id))
    if (updateError) throw new Error(updateError.message)

    allocations.push({
      source: "cartera",
      id: String(item.id),
      label: item.siesa_factura ? String(item.siesa_factura) : null,
      amountApplied: applied,
      ppApplied: 0,
      saldoAfter: newSaldo,
    })

    remaining -= applied
  }

  const totalApplied = paymentAmount - remaining

  return {
    totalApplied,
    remainder: remaining,
    allocations,
    itemsCleared: allocations.filter((a) => a.saldoAfter === 0).length,
    ppTotal,
  }
}
