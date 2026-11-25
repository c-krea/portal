import { isFestivoColombia } from "./festivos"

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

// The one day of the month tenants may send their meter reading.
//
// Nominally the 9th. If the 9th is a Sunday or a Colombian holiday nobody is at the
// local to read the meter, so the day moves forward to the next one that is neither.
// Saturday is a normal working day at Ckrea and does NOT move.
//
// The step repeats on purpose: Ley Emiliani puts most Colombian holidays on a MONDAY,
// so a Sunday 9th very often moves onto a holiday Monday and has to move again
// (e.g. 9th on Sunday + holiday Monday the 10th → the reading day is the 11th).
//
// Still exactly one reading day per month, so "no reading today → 1,5× el promedio"
// stays a single, unambiguous deadline. periodo is unaffected: lecturaPeriodo() is
// month-based, so a reading sent on a moved day books to the same previous month.
export function lecturaDay(now: Date = nowBogota()): number {
  const d = new Date(now.getFullYear(), now.getMonth(), 9)
  while (d.getDay() === 0 || isFestivoColombia(d)) d.setDate(d.getDate() + 1)
  return d.getDate()
}

export function isLecturaWindow(now: Date = nowBogota()): boolean {
  return now.getDate() === lecturaDay(now)
}

// "2026-06" → "2026-05". The month a reading's lectura_anterior must come from.
export function mesAnterior(periodo: string): string {
  const [y, m] = periodo.split("-").map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

// Business day = Monday–Friday that is not a Colombian holiday (Saturday does NOT
// count here, unlike lecturaDay: this is for accounting closes, not the local).
export function esDiaHabil(d: Date): boolean {
  const dow = d.getDay()
  return dow !== 0 && dow !== 6 && !isFestivoColombia(d)
}

// Day of the month of the n-th business day of `now`'s month.
export function diaHabilDelMes(n: number, now: Date = nowBogota()): number {
  const d = new Date(now.getFullYear(), now.getMonth(), 1)
  let count = 0
  for (;;) {
    if (esDiaHabil(d) && ++count === n) return d.getDate()
    d.setDate(d.getDate() + 1)
  }
}

// Current billing month in Bogota, "YYYY-MM" (e.g. "2026-06"). Use this instead
// of new Date() so the UTC/Bogota boundary never rolls the month early.
export function currentPeriodo(): string {
  const now = nowBogota()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}
