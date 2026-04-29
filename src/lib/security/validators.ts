const PERIODO_RE = /^\d{4}-(0[1-9]|1[0-2])$/
const YEAR_RE = /^(20[2-3][0-9])$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const UNIT_RE = /^[A-Za-z0-9-]{1,20}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidPeriodo(p: string | null | undefined): p is string {
  return typeof p === "string" && PERIODO_RE.test(p)
}

export function isValidYear(y: string | null | undefined): y is string {
  return typeof y === "string" && YEAR_RE.test(y)
}

export function isValidUuid(id: string | null | undefined): id is string {
  return typeof id === "string" && UUID_RE.test(id)
}

export function isValidUnit(u: string | null | undefined): u is string {
  return typeof u === "string" && UNIT_RE.test(u)
}

export function isValidEmail(e: string | null | undefined): e is string {
  return typeof e === "string" && EMAIL_RE.test(e)
}

export function assertPeriodo(p: string): void {
  if (!PERIODO_RE.test(p)) throw new Error(`Invalid periodo: ${p}. Expected YYYY-MM.`)
}

export function assertYear(y: string | number): void {
  if (!YEAR_RE.test(String(y))) throw new Error(`Invalid year: ${y}. Expected YYYY (2020-2039).`)
}

export function assertUuid(id: string): void {
  if (!UUID_RE.test(id)) throw new Error(`Invalid UUID: ${id}.`)
}

export function assertUnit(u: string): void {
  if (!UNIT_RE.test(u)) throw new Error(`Invalid unit: ${u}.`)
}

export function assertEmail(e: string): void {
  if (!EMAIL_RE.test(e)) throw new Error(`Invalid email: ${e}.`)
}
