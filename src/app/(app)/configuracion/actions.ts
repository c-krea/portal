"use server"

import { supabaseAdmin } from "@/lib/db/executor"
import { revalidatePath } from "next/cache"
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
    const { error } = await supabaseAdmin
      .from("financial_rules")
      .update({ rule_value: String(parsed.data.value) })
      .eq("id", parsed.data.id)
    if (error) throw new Error(error.message)

    revalidatePath("/configuracion")
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) }
  }
}
