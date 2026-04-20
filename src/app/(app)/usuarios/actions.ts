"use server"

import { supabaseAdmin } from "@/lib/db/executor"
import { revalidatePath } from "next/cache"

export async function updatePortalEmail(tenantId: string, email: string) {
  const trimmed = email.trim().toLowerCase()
  if (!trimmed || !trimmed.includes("@")) {
    return { error: "Email inválido" }
  }
  const { error } = await supabaseAdmin
    .from("tenants")
    .update({ portal_email: trimmed })
    .eq("id", tenantId)
  if (error) return { error: error.message }
  revalidatePath("/usuarios")
  return { success: true }
}
