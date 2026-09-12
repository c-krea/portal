import { execute } from "@/lib/db/executor"

export type FinancialRule = {
  id: string
  ruleKey: string
  ruleValue: number
  description: string | null
}

// Human-readable labels for each rule key. interes_mora_diario is DELIBERATELY
// absent: since 2026-07-10 the live mora rate is the DIAN rate administered on
// /mora (v2.tasa_interes_mora) and nothing reads that rule row anymore.
// `displayPercent` means the stored value is a decimal fraction (0.19) but the
// human reads/writes a percentage (19) — RuleForm converts both ways so the
// STORED value never changes meaning.
export const RULE_LABELS: Record<string, { label: string; unit: string; hint: string; displayPercent?: boolean }> = {
  iva_rate:          { label: "IVA",                    unit: "%",    hint: "Impuesto que se suma al canon en cada factura.",           displayPercent: true },
  pp_window_days:    { label: "Ventana de pronto pago",  unit: "días", hint: "Días que tiene el inquilino para pagar con descuento." },
  grace_period_days: { label: "Período de gracia",       unit: "días", hint: "Días de atraso antes de que una factura entre en mora." },
  ipc_increment_pct: { label: "Incremento IPC",          unit: "%",    hint: "Porcentaje en que sube el canon cada año." },
}

export async function getGracePeriod(): Promise<number> {
  const rows = await execute(`
    SELECT valor::numeric AS valor FROM v2.reglas_financieras
    WHERE clave = 'grace_period_days'
    LIMIT 1
  `)
  return Number((rows as Array<Record<string, unknown>>)[0]?.valor ?? 0)
}

// Scalar readers for the two /configuracion knobs that were previously
// display-only (WOR-320). Same shape as getGracePeriod: one row, numeric.
// Fallbacks are today's stored values (0.19 / 10), NOT zero: a missing row
// must keep invoices at the status quo, never silently zero the tax.
export async function getIvaRate(): Promise<number> {
  const rows = await execute(`
    SELECT valor::numeric AS valor FROM v2.reglas_financieras
    WHERE clave = 'iva_rate'
    LIMIT 1
  `)
  return Number((rows as Array<Record<string, unknown>>)[0]?.valor ?? 0.19)
}

export async function getPpWindowDays(): Promise<number> {
  const rows = await execute(`
    SELECT valor::numeric AS valor FROM v2.reglas_financieras
    WHERE clave = 'pp_window_days'
    LIMIT 1
  `)
  return Number((rows as Array<Record<string, unknown>>)[0]?.valor ?? 10)
}

export async function getFinancialRules(empresaId: string): Promise<FinancialRule[]> {
  const rows = await execute(`
    SELECT id::text, clave, valor::numeric, descripcion
    FROM v2.reglas_financieras
    WHERE empresa_id = '${empresaId}'::uuid
    ORDER BY clave
  `)
  return (rows as Array<Record<string, unknown>>).map((r) => ({
    id: String(r.id),
    ruleKey: String(r.clave),
    ruleValue: Number(r.valor),
    description: r.descripcion ? String(r.descripcion) : null,
  }))
}
