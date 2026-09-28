"use server"

import { execute, executeDml } from "@/lib/db/executor"
import { revalidatePath } from "next/cache"
import { bustAllCaches } from "@/lib/cache"
import { z } from "zod"

const UpdateRuleSchema = z.object({
  id: z.string().uuid(),
  value: z.number().finite(),
})

export type UpdateRuleState = {
  success: boolean
  error?: string
  ruleKey?: string
}

export async function updateFinancialRule(
  _prev: UpdateRuleState,
  formData: FormData,
): Promise<UpdateRuleState> {
  const parsed = UpdateRuleSchema.safeParse({
    id: formData.get("id"),
    value: Number(formData.get("value")),
  })
  if (!parsed.success) {
    return { success: false, error: "Valor inválido" }
  }

  try {
    const keyRows = await execute(
      `SELECT clave FROM v2.reglas_financieras WHERE id = '${parsed.data.id}'::uuid LIMIT 1`
    )
    const ruleKey = String((keyRows[0] as Record<string, unknown> | undefined)?.clave ?? "")
    const value = parsed.data.value
    // Allow-list, not a default-allow: an unknown id (or the hidden, dead
    // interes_mora_diario and grace_period_days rows) must not be writable through this action just
    // because no bound names it. Every writable knob is bounded below.
    const EDITABLE = ["iva_rate", "pp_window_days", "ipc_increment_pct"]
    if (!EDITABLE.includes(ruleKey)) {
      return { success: false, error: "Este parámetro no se puede editar desde esta página." }
    }
    if (ruleKey === "iva_rate" && !(value >= 0 && value <= 1)) {
      return { success: false, error: "El IVA debe estar entre 0 % y 100 %." }
    }
    if (
      ruleKey === "pp_window_days" &&
      !(Number.isInteger(value) && value >= 0 && value <= 90)
    ) {
      return {
        success: false,
        error: "La ventana de pronto pago debe ser un número entero entre 0 y 90 días.",
      }
    }
    if (ruleKey === "ipc_increment_pct" && !(value >= 0 && value <= 100)) {
      return { success: false, error: "El incremento IPC debe estar entre 0 y 100 %." }
    }

    await executeDml(
      `UPDATE v2.reglas_financieras SET valor = '${parsed.data.value}' WHERE id = '${parsed.data.id}'::uuid`
    )

    revalidatePath("/configuracion")
    // Financial rules feed mora/pagos/locales/dashboard math — refresh all caches.
    bustAllCaches()
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) }
  }
}
