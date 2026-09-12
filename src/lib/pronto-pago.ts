// Rule A (pronto pago) eligibility window: the discount is valid for the first
// `windowDays` calendar days after an invoice's OWN date (issue day 0 … day
// `windowDays` inclusive). `windowDays` is the stored pp_window_days rule
// (10 today — with 10, a 1st-of-month invoice cut mid-day counts from the 2nd
// → last valid day is the 11th). REQUIRED parameter, deliberately no default:
// a default would silently hide a caller that forgot to read the rule, which is
// exactly the bug class this wiring fixes. Single source of truth so the
// tenant portal and the admin locales view — which must always agree — share the
// exact same date math. Pass a Bogotá-anchored `today` (both callers do).
export function isPpDateEligible(fechaFactura: string | null, today: Date, windowDays: number): boolean {
  if (!fechaFactura) return false
  const diffDays = Math.round(
    (today.getTime() - new Date(fechaFactura + "T00:00:00").getTime()) / 86_400_000,
  )
  return diffDays >= 0 && diffDays <= windowDays
}
