/**
 * Rule C — Late-Interest Accrual (Intereses de Mora)
 *
 * Spec §4:
 *   - Daily rate: 0.05% = 0.0005
 *   - Accrual starts day 11 (first day after 10-day payment window)
 *   - Outstanding balance = invoice.saldo (principal only, no PP since they're late)
 *   - INTEREST = outstanding_balance * 0.0005 * days_overdue
 *   - One accrual row per invoice per run date (idempotent — skip if row already exists)
 *   - Updates invoice.subtotal_interes (cumulative) + status → 'vencida'
 */

import { db } from "@/lib/db/client"
import { invoices, interestAccruals } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"

const DAILY_RATE = 0.0005 // 0.05%/day = 1.5%/month

export type AccrualResult = {
  invoiceId: string
  unitNumber: string
  clienteName: string
  periodo: string
  daysOverdue: number
  overdueBalance: number
  interestAmount: number
  cumulativeInterest: number
}

export type InterestAccrualSummary = {
  accrualDate: string
  processed: number
  skipped: number       // already had accrual for this date
  totalInterest: number
  results: AccrualResult[]
  errors: string[]
}

/**
 * Run interest accrual for all overdue invoices as of accrualDate.
 * Safe to call multiple times on the same date — skips existing accruals.
 */
export async function runInterestAccrual(
  companyId: string,
  accrualDate: string, // YYYY-MM-DD
): Promise<InterestAccrualSummary> {
  // Fetch all overdue invoices: emitida/parcial/vencida with fecha_vencimiento < accrualDate AND saldo > 0
  const overdueRows = await db.execute(sql`
    SELECT
      i.id,
      i.contract_id,
      i.tenant_id,
      i.fecha_vencimiento,
      u.unit_number,
      COALESCE(t.nombre_corto, t.razon_social) AS cliente_name,
      i.periodo,
      i.saldo::numeric          AS saldo,
      COALESCE(i.subtotal_interes, 0)::numeric AS subtotal_interes,
      i.status,
      COALESCE(c.grace_period_days, 0)         AS grace_period_days
    FROM invoices i
    JOIN contracts c ON i.contract_id = c.id
    JOIN tenants t   ON i.tenant_id   = t.id
    JOIN units u     ON i.unit_id     = u.id
    WHERE i.company_id = ${companyId}::uuid
      AND i.status IN ('emitida', 'parcial', 'vencida')
      AND i.saldo::numeric > 0
      AND i.fecha_vencimiento < ${accrualDate}::date
    ORDER BY i.fecha_vencimiento
  `)

  // Fetch which invoices already have an accrual for this date
  const existingAccruals = await db.execute(sql`
    SELECT DISTINCT invoice_id FROM interest_accruals
    WHERE accrual_date = ${accrualDate}::date
  `)
  const alreadyAccrued = new Set(
    (existingAccruals as Array<Record<string, unknown>>).map((r) => String(r.invoice_id)),
  )

  let processed = 0
  let skipped = 0
  let totalInterest = 0
  const results: AccrualResult[] = []
  const errors: string[] = []

  for (const row of overdueRows as Array<Record<string, unknown>>) {
    const invoiceId = String(row.id)

    if (alreadyAccrued.has(invoiceId)) {
      skipped++
      continue
    }

    try {
      const fechaVencimiento = String(row.fecha_vencimiento)
      const graceDays = Number(row.grace_period_days)

      // Days overdue = accrualDate - fechaVencimiento - graceDays
      // Interest starts on day 11 (first day after 10-day window), which = fecha_vencimiento + 1
      const daysOverdue = Math.max(
        0,
        daysBetween(fechaVencimiento, accrualDate) - graceDays,
      )

      if (daysOverdue <= 0) {
        skipped++
        continue
      }

      const overdueBalance = Number(row.saldo)
      const interestAmount = Math.round(overdueBalance * DAILY_RATE * daysOverdue)
      const prevCumulative = Number(row.subtotal_interes)
      const cumulativeInterest = prevCumulative + interestAmount

      // Insert accrual row
      await db.insert(interestAccruals).values({
        invoiceId,
        contractId: String(row.contract_id),
        accrualDate,
        daysOverdue,
        overdueBalance: String(overdueBalance),
        dailyRate: String(DAILY_RATE),
        interestAmount: String(interestAmount),
        cumulativeInterest: String(cumulativeInterest),
      })

      // Update invoice: subtotal_interes + status → vencida
      await db
        .update(invoices)
        .set({
          subtotalInteres: String(cumulativeInterest),
          status: "vencida",
        })
        .where(eq(invoices.id, invoiceId))

      results.push({
        invoiceId,
        unitNumber:        String(row.unit_number),
        clienteName:       String(row.cliente_name),
        periodo:           String(row.periodo),
        daysOverdue,
        overdueBalance,
        interestAmount,
        cumulativeInterest,
      })

      totalInterest += interestAmount
      processed++
    } catch (e) {
      errors.push(
        `${row.unit_number} (${row.periodo}): ${e instanceof Error ? e.message : String(e)}`,
      )
    }
  }

  return { accrualDate, processed, skipped, totalInterest, results, errors }
}

/** Calendar days between two YYYY-MM-DD strings (positive = b is after a) */
function daysBetween(a: string, b: string): number {
  return Math.floor(
    (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24),
  )
}
