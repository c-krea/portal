"use server"

import { supabaseAdmin } from "@/lib/db/executor"
import { assertUuid, isValidEmail } from "@/lib/security/validators"
import { sendWelcomeEmail, sendPasswordResetEmail } from "@/lib/email"
import { revalidatePath } from "next/cache"

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://paycontrol.ckrea.co"

export async function updatePortalEmail(inquilinoId: string, email: string) {
  assertUuid(inquilinoId)
  const trimmed = email.trim().toLowerCase()
  if (!isValidEmail(trimmed)) {
    return { error: "Email inválido" }
  }

  // 1. Update v2.inquilinos
  const { error: dbError } = await supabaseAdmin
    .schema("v2")
    .from("inquilinos")
    .update({ portal_email: trimmed })
    .eq("id", inquilinoId)
  if (dbError) return { error: dbError.message }

  // 2. Sync auth.users if perfil exists
  const { data: profile } = await supabaseAdmin
    .schema("v2")
    .from("perfiles")
    .select("id")
    .eq("inquilino_id", inquilinoId)
    .eq("rol", "inquilino")
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

export async function updateTenantInquilino(
  inquilinoId: string,
  data: { telefono: string; email: string },
) {
  assertUuid(inquilinoId)
  const email = data.email.trim().toLowerCase()
  if (email && !isValidEmail(email)) return { error: "Email inválido" }

  const { error: inquilinoError } = await supabaseAdmin
    .schema("v2")
    .from("inquilinos")
    .update({
      telefono:       data.telefono.trim() || null,
      email_contacto: email || null,
      portal_email:   email || null,
    })
    .eq("id", inquilinoId)
  if (inquilinoError) return { error: inquilinoError.message }

  if (email) {
    const { data: profile } = await supabaseAdmin
      .schema("v2")
      .from("perfiles")
      .select("id")
      .eq("inquilino_id", inquilinoId)
      .eq("rol", "inquilino")
      .single()
    if (profile?.id) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        profile.id,
        { email }
      )
      if (authError) return { error: `Guardado, pero error en auth: ${authError.message}` }
    }
  }

  revalidatePath("/usuarios")
  return { success: true }
}


export async function createTenantAccount(inquilinoId: string) {
  assertUuid(inquilinoId)

  const { data: inquilino, error: fetchError } = await supabaseAdmin
    .schema("v2")
    .from("inquilinos")
    .select("portal_email, nombre_corto, razon_social, empresa_id")
    .eq("id", inquilinoId)
    .single()

  if (fetchError || !inquilino) return { error: "Inquilino no encontrado" }
  if (!inquilino.portal_email) return { error: "Sin email configurado" }

  const email    = inquilino.portal_email as string
  const fullName = (inquilino.nombre_corto || inquilino.razon_social) as string

  // Try to create; if email already exists, recover the existing auth user
  let authUserId: string
  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "inquilino" },
  })

  if (createError) {
    const alreadyExists =
      createError.message.toLowerCase().includes("already") ||
      createError.message.toLowerCase().includes("registered")

    if (!alreadyExists) {
      return { error: `Error al crear la cuenta: ${createError.message}` }
    }

    // Email already in auth.users — find and reuse that user
    const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const existing = allUsers?.users?.find(u => u.email === email)
    if (!existing) return { error: "El email ya está registrado pero no se pudo localizar la cuenta. Contacta soporte." }
    authUserId = existing.id
  } else {
    authUserId = created.user.id
  }

  // Upsert perfiles to link this auth user to the tenant
  const { error: perfilError } = await supabaseAdmin
    .schema("v2")
    .from("perfiles")
    .upsert({
      id:              authUserId,
      inquilino_id:    inquilinoId,
      rol:             "inquilino",
      nombre_completo: fullName,
      empresa_id:      inquilino.empresa_id,
      email,
    }, { onConflict: "id" })
  if (perfilError) {
    return { error: `Cuenta lista, pero error al vincular perfil: ${perfilError.message}` }
  }

  // Send welcome email with password-setup link
  const redirectTo = `${SITE}/auth/confirm`
  const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  })
  if (linkData?.properties?.action_link) {
    await sendWelcomeEmail({ to: email, name: fullName, setupUrl: linkData.properties.action_link })
  }

  revalidatePath("/usuarios")
  return { success: true }
}

export async function updateAdminUser(
  userId: string,
  data: { fullName: string; email: string; role: string },
) {
  assertUuid(userId)
  const email = data.email.trim().toLowerCase()
  if (!isValidEmail(email)) return { error: "Email inválido" }
  if (!data.fullName.trim()) return { error: "El nombre es obligatorio" }
  if (!["admin", "finanzas", "visor"].includes(data.role)) {
    return { error: "Rol inválido" }
  }

  const { error: profileError } = await supabaseAdmin
    .schema("v2")
    .from("perfiles")
    .update({ nombre_completo: data.fullName.trim(), email, rol: data.role as "admin" | "finanzas" | "visor" | "inquilino" })
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

export async function sendSystemEmail(data: {
  toEmail: string
  toName: string
  type: "welcome" | "reset"
}): Promise<{ success?: boolean; error?: string }> {
  if (!isValidEmail(data.toEmail)) return { error: "Email inválido" }

  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ckrea-portal.vercel.app"
  const redirectTo = `${SITE}/auth/confirm`

  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email: data.toEmail,
    options: { redirectTo },
  })

  if (linkError || !linkData?.properties?.action_link) {
    return { error: "No se pudo generar el enlace. Verifica que el usuario tenga cuenta activa." }
  }

  try {
    if (data.type === "welcome") {
      await sendWelcomeEmail({ to: data.toEmail, name: data.toName, setupUrl: linkData.properties.action_link })
    } else {
      await sendPasswordResetEmail({ to: data.toEmail, resetUrl: linkData.properties.action_link })
    }
    return { success: true }
  } catch {
    return { error: "No se pudo enviar el email. Intenta de nuevo." }
  }
}
