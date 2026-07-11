// Rule A (pronto pago) eligibility window: the discount is valid for the first
// 10 calendar days after an invoice's OWN date (issue day 0 … day 10 inclusive).
// A 1st-of-month invoice is cut mid-day, so the 1st is a partial day and the count
// runs from the 2nd → last valid day is the 11th. Single source of truth so the
// tenant portal and the admin locales view — which must always agree — share the
// exact same date math. Pass a Bogotá-anchored `today` (both callers do).
export function isPpDateEligible(fechaFactura: string | null, today: Date): boolean {
  if (!fechaFactura) return false
  const diffDays = Math.round(
    (today.getTime() - new Date(fechaFactura + "T00:00:00").getTime()) / 86_400_000,
  )
  return diffDays >= 0 && diffDays <= 10
}
