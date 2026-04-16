"use server"

import { db } from "@/lib/db/client"
import { financialRules } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
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
    await db
      .update(financialRules)
      .set({ ruleValue: String(parsed.data.value) })
      .where(eq(financialRules.id, parsed.data.id))

    revalidatePath("/configuracion")
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) }
  }
}
