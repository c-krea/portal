"use server"

import { executeDml } from "@/lib/db/executor"
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
