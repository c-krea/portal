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

// "2026-06" → "2026-05". The month a reading's lectura_anterior must come from.
export function mesAnterior(periodo: string): string {
  const [y, m] = periodo.split("-").map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

// Current billing month in Bogota, "YYYY-MM" (e.g. "2026-06"). Use this instead
// of new Date() so the UTC/Bogota boundary never rolls the month early.
export function currentPeriodo(): string {
  const now = nowBogota()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}
