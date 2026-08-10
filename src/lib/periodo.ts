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

// Tenant submission window for meter readings.
//
// The nominal reading day is the 9th. When the 9th falls on a Saturday or Sunday
// nobody is at the local to read the meter, so the window stays open through the
// following business day instead of being lost for the month:
//   9th on Sunday   → open on the 9th and the 10th (Monday)
//   9th on Saturday → open on the 9th, 10th and 11th (Monday)
// The window never loses the 9th itself — a tenant who does work the weekend can
// still submit on time. periodo is unaffected: lecturaPeriodo() is month-based,
// so a reading sent on the 10th or 11th still lands on the same previous month.
export function isLecturaWindow(now: Date = nowBogota()): boolean {
  const day = now.getDate()
  if (day === 9) return true

  const ninthDow = new Date(now.getFullYear(), now.getMonth(), 9).getDay() // 0 = Sun, 6 = Sat
  if (ninthDow === 0) return day === 10             // Sunday    → Monday
  if (ninthDow === 6) return day === 10 || day === 11 // Saturday → Sunday + Monday
  return false
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
