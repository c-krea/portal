import { execute, supabaseAdmin } from "@/lib/db/executor"

export type FinancialRule = {
  id: string
  ruleKey: string
  ruleValue: number
  description: string | null
}

// Human-readable labels for each rule key
export const RULE_LABELS: Record<string, { label: string; unit: string; hint: string }> = {
  iva_rate:            { label: "IVA",                    unit: "decimal",  hint: "0.19 = 19%" },
  pp_window_days:      { label: "Ventana Pronto Pago",    unit: "días",     hint: "Días desde factura para aplicar descuento PP" },
  interes_mora_diario: { label: "Tasa de interés mora",   unit: "decimal",  hint: "Diario: 0.000667 = 2%/mes · 0.0005 = 1.5%/mes" },
  grace_period_days:   { label: "Período de gracia",      unit: "días",     hint: "Días de retraso antes de entrar en mora (ej: 30)" },
  ipc_increment_pct:   { label: "Incremento IPC anual",   unit: "%",        hint: "Porcentaje anual (ej: 5.1)" },
}

export async function getGracePeriod(): Promise<number> {
  const rows = await execute(`
    SELECT valor::numeric AS valor FROM v2.reglas_financieras
    WHERE clave = 'grace_period_days'
    LIMIT 1
  `)
  return Number((rows as Array<Record<string, unknown>>)[0]?.valor ?? 0)
}

export async function getFinancialRules(empresaId: string): Promise<FinancialRule[]> {
  const { data, error } = await supabaseAdmin
    .schema("v2")
    .from("reglas_financieras")
    .select("id, clave, valor, descripcion")
    .eq("empresa_id", empresaId)
    .order("clave")
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => ({
    id: r.id as string,
    ruleKey: r.clave as string,
    ruleValue: Number(r.valor),
    description: r.descripcion as string | null,
  }))
}
