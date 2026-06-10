// Billing-period conventions for electricity meter readings (America/Bogota).
//
// A reading taken on day 9 of month N measures month N-1's consumption,
// so it is ALWAYS stored under the previous month's periodo
// (e.g. submitted June 9 → periodo "2026-05").
// Single source of truth — portal form, server action and admin pages all use this.

export function nowBogota(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }))
}

export function lecturaPeriodo(): string {
  const now = nowBogota()
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}
