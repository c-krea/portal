"use server"

import { supabaseAdmin } from "@/lib/db/executor"
import { revalidatePath } from "next/cache"

export async function updatePortalEmail(tenantId: string, email: string) {
  const trimmed = email.trim().toLowerCase()
  if (!trimmed || !trimmed.includes("@")) {
    return { error: "Email inválido" }
  }

  // 1. Update tenants table
  const { error: dbError } = await supabaseAdmin
    .from("tenants")
    .update({ portal_email: trimmed })
    .eq("id", tenantId)
  if (dbError) return { error: dbError.message }

  // 2. If tenant already has an auth account, keep auth.users in sync
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("role", "tenant")
    .single()

  if (profile?.id) {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      profile.id,
      { email: trimmed }
    )
    if (authError) return { error: `Email guardado, pero no se pudo actualizar auth: ${authError.message}` }
  }

  revalidatePath("/usuarios")
  return { success: true }
}

export async function updateAdminUser(
  userId: string,
  data: { fullName: string; email: string; role: string }
) {
  const email = data.email.trim().toLowerCase()
  if (!email.includes("@")) return { error: "Email inválido" }
  if (!data.fullName.trim()) return { error: "El nombre es obligatorio" }

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({ full_name: data.fullName.trim(), email, role: data.role })
    .eq("id", userId)
  if (profileError) return { error: profileError.message }

  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { email }
  )
  if (authError) return { error: `Perfil guardado, pero no se pudo actualizar auth: ${authError.message}` }

  revalidatePath("/usuarios")
  return { success: true }
}
