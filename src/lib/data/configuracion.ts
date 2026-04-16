import { db } from "@/lib/db/client"
import { financialRules } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"

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

export async function getFinancialRules(companyId: string): Promise<FinancialRule[]> {
  const rows = await db
    .select({
      id: financialRules.id,
      ruleKey: financialRules.ruleKey,
      ruleValue: financialRules.ruleValue,
      description: financialRules.description,
    })
    .from(financialRules)
    .where(eq(financialRules.companyId, sql`${companyId}::uuid`))
    .orderBy(financialRules.ruleKey)

  return rows.map((r) => ({
    ...r,
    ruleValue: Number(r.ruleValue),
  }))
}
