// Colombian public holidays (días festivos) — computed, not tabulated, so there is
// no yearly list to maintain and no year the portal silently gets wrong.
//
// Three groups (Ley 51 de 1983, "Ley Emiliani"):
//   1. Fixed dates that never move.
//   2. Fixed dates observed the FOLLOWING MONDAY when they don't already fall on one.
//   3. Easter-relative days — Jueves and Viernes Santo stay put, the other three move
//      to the following Monday like group 2.
//
// Everything here is plain local-calendar arithmetic (new Date(y, m, d)). Callers pass
// a Bogotá-shifted date (see nowBogota in periodo.ts) so there is no UTC boundary to
// cross and a holiday never lands a day early or late.

const FIJOS: ReadonlyArray<readonly [number, number]> = [
  [1, 1],   // Año Nuevo
  [5, 1],   // Día del Trabajo
  [7, 20],  // Grito de Independencia
  [8, 7],   // Batalla de Boyacá
  [12, 8],  // Inmaculada Concepción
  [12, 25], // Navidad
]

const TRASLADABLES: ReadonlyArray<readonly [number, number]> = [
  [1, 6],   // Reyes Magos
  [3, 19],  // San José
  [6, 29],  // San Pedro y San Pablo
  [8, 15],  // Asunción de la Virgen
  [10, 12], // Día de la Raza
  [11, 1],  // Todos los Santos
  [11, 11], // Independencia de Cartagena
]

// Easter Sunday, Western/Gregorian — Meeus/Jones/Butcher algorithm.
function pascua(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31) // 3 = marzo, 4 = abril
  const dia = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, mes - 1, dia)
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
}

// Ley Emiliani: observed the following Monday, unless it already is a Monday.
function aLunes(d: Date): Date {
  const dow = d.getDay()
  return dow === 1 ? d : addDays(d, (8 - dow) % 7)
}

const mmdd = (d: Date) => `${d.getMonth() + 1}-${d.getDate()}`

const cache = new Map<number, Set<string>>()

/** The 18 Colombian holidays of `year`, as a set of "M-D" keys. Memoized per year. */
export function festivosColombia(year: number): Set<string> {
  const hit = cache.get(year)
  if (hit) return hit

  const out = new Set<string>()
  for (const [m, d] of FIJOS) out.add(`${m}-${d}`)
  for (const [m, d] of TRASLADABLES) out.add(mmdd(aLunes(new Date(year, m - 1, d))))

  const e = pascua(year)
  out.add(mmdd(addDays(e, -3)))        // Jueves Santo
  out.add(mmdd(addDays(e, -2)))        // Viernes Santo
  out.add(mmdd(aLunes(addDays(e, 39)))) // Ascensión del Señor
  out.add(mmdd(aLunes(addDays(e, 60)))) // Corpus Christi
  out.add(mmdd(aLunes(addDays(e, 68)))) // Sagrado Corazón de Jesús

  cache.set(year, out)
  return out
}

export function isFestivoColombia(d: Date): boolean {
  return festivosColombia(d.getFullYear()).has(mmdd(d))
}
