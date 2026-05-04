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
  data: {
    nombre: string
    razonSocial: string
    nit: string
    telefono: string
    contactoNombre: string
    portalEmail: string
    businessEmail: string
  },
) {
  assertUuid(inquilinoId)
  if (!data.razonSocial.trim()) return { error: "La razón social es obligatoria" }
  const portalEmail = data.portalEmail.trim().toLowerCase()
  if (portalEmail && !isValidEmail(portalEmail)) return { error: "Email portal inválido" }
  const bizEmail = data.businessEmail.trim().toLowerCase()
  if (bizEmail && !isValidEmail(bizEmail)) return { error: "Email de contacto inválido" }

  const { error: inquilinoError } = await supabaseAdmin
    .schema("v2")
    .from("inquilinos")
    .update({
      nombre_corto:    data.nombre.trim() || null,
      razon_social:    data.razonSocial.trim(),
      nit:             data.nit.trim() || null,
      telefono:        data.telefono.trim() || null,
      contacto_nombre: data.contactoNombre.trim() || null,
      email_contacto:  bizEmail || null,
      portal_email:    portalEmail || null,
    })
    .eq("id", inquilinoId)
  if (inquilinoError) return { error: inquilinoError.message }

  if (portalEmail) {
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
        { email: portalEmail }
      )
      if (authError) return { error: `Guardado, pero error en auth: ${authError.message}` }
    }
  }

  revalidatePath("/usuarios")
  return { success: true }
}

export async function updateTenantContract(
  contractId: string,
  localId: string,
  data: {
    unitNumber: string
    entrada: string
    canonBase?: number
    descuentoPct?: number | null
    prontoPagoPct?: number | null
    fechaInicio?: string
    fechaFin?: string | null
    descripcionDescuentos?: string | null
  },
) {
  assertUuid(contractId)
  assertUuid(localId)

  const localUpdate: Record<string, string> = {}
  if (data.unitNumber.trim()) localUpdate.unidad = data.unitNumber.trim()
  if (data.entrada.trim()) localUpdate.entrada = data.entrada.trim()
  if (Object.keys(localUpdate).length > 0) {
    const { error: localError } = await supabaseAdmin
      .schema("v2")
      .from("locales")
      .update(localUpdate)
      .eq("id", localId)
    if (localError) return { error: `Error en local: ${localError.message}` }
  }

  if (data.canonBase != null) {
    const { error: contractError } = await supabaseAdmin
      .schema("v2")
      .from("contratos")
      .update({
        canon_base:             data.canonBase,
        descuento_pct:          data.descuentoPct ?? 0,
        pronto_pago_pct:        data.prontoPagoPct ?? 0,
        fecha_inicio:           data.fechaInicio ?? undefined,
        fecha_fin:              data.fechaFin ?? null,
        descripcion_descuentos: data.descripcionDescuentos ?? null,
        updated_at:             new Date().toISOString(),
      })
      .eq("id", contractId)
    if (contractError) return { error: `Error en contrato: ${contractError.message}` }
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

  const fullName = (inquilino.nombre_corto || inquilino.razon_social) as string

  const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: inquilino.portal_email as string,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "inquilino" },
  })

  if (authError) return { error: authError.message }

  // Trigger creates perfil — patch it with inquilino_id + rol
  const { error: perfilError } = await supabaseAdmin
    .schema("v2")
    .from("perfiles")
    .update({
      inquilino_id: inquilinoId,
      rol: "inquilino",
      nombre_completo: fullName,
      empresa_id: inquilino.empresa_id,
    })
    .eq("id", data.user.id)
  if (perfilError) {
    return { error: `Cuenta creada, pero error al asignar perfil: ${perfilError.message}` }
  }

  // Generate password-setup link and send welcome email
  const redirectTo = `${SITE}/auth/confirm`
  const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email: inquilino.portal_email as string,
    options: { redirectTo },
  })
  if (linkData?.properties?.action_link) {
    await sendWelcomeEmail({
      to: inquilino.portal_email as string,
      name: fullName,
      setupUrl: linkData.properties.action_link,
    })
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
