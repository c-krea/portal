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

import { db } from "@/lib/db/client"
import { cartera, invoices, paymentApplications } from "@/lib/db/schema"
import { eq, asc, sql } from "drizzle-orm"

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
  const openInvoices = await db
    .select({
      id: invoices.id,
      periodo: invoices.periodo,
      fechaEmision: invoices.fechaEmision,
      fechaProntoPago: invoices.fechaProntoPago,
      subtotalProntoPago: invoices.subtotalProntoPago,
      subtotalInteres: invoices.subtotalInteres,
      saldo: invoices.saldo,
      status: invoices.status,
    })
    .from(invoices)
    .where(
      sql`${invoices.tenantId} = ${tenantId}::uuid
        AND (${invoices.saldo}::numeric > 0 OR ${invoices.subtotalInteres}::numeric > 0)
        AND ${invoices.status} IN ('borrador', 'emitida', 'parcial', 'vencida')`,
    )
    .orderBy(asc(sql`${invoices.fechaEmision}`))

  // 2. Open cartera (Siesa snapshot), oldest first
  const openCartera = await db
    .select({
      id: cartera.id,
      siesaFactura: cartera.siesaFactura,
      fechaFactura: cartera.fechaFactura,
      saldo: cartera.saldo,
      valorVencido: cartera.valorVencido,
    })
    .from(cartera)
    .where(
      sql`${cartera.tenantId} = ${tenantId}::uuid AND ${cartera.saldo}::numeric > 0`,
    )
    .orderBy(asc(sql`${cartera.fechaFactura} NULLS LAST`))

  let remaining = paymentAmount
  const allocations: AllocationResult[] = []
  let ppTotal = 0

  // Apply to portal invoices first (PP logic + interest first per spec §9.10)
  for (const inv of openInvoices) {
    if (remaining <= 0) break

    const currentSaldo = Number(inv.saldo)
    const currentInteres = Number(inv.subtotalInteres ?? 0)
    const ppRef = Number(inv.subtotalProntoPago ?? 0)

    // Check if payment is within pronto pago window
    const withinPP =
      ppRef > 0 &&
      inv.fechaProntoPago != null &&
      fechaRecaudo <= String(inv.fechaProntoPago)

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

    await db
      .update(invoices)
      .set({
        saldo:            String(Math.round(newSaldo)),
        subtotalInteres:  String(Math.round(newInteres)),
        status:           newStatus,
      })
      .where(eq(invoices.id, inv.id))

    // Insert payment_application record
    await db.insert(paymentApplications).values({
      paymentId,
      invoiceId: inv.id,
      amountApplied: String(Math.round(totalAppliedThisInvoice + ppApplied)),
    })

    allocations.push({
      source: "invoice",
      id: inv.id,
      label: `Factura ${inv.periodo}`,
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
    const currentVencido = Number(item.valorVencido ?? 0)
    const applied = Math.min(remaining, currentSaldo)

    const newSaldo = Math.max(0, currentSaldo - applied)
    const newVencido = Math.max(0, currentVencido - applied)

    await db
      .update(cartera)
      .set({
        saldo: String(newSaldo.toFixed(2)),
        valorVencido: String(newVencido.toFixed(2)),
      })
      .where(eq(cartera.id, item.id))

    allocations.push({
      source: "cartera",
      id: item.id,
      label: item.siesaFactura,
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
