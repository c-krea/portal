"use server"

import { supabaseAdmin } from "@/lib/db/executor"
import { revalidatePath } from "next/cache"

export async function updatePortalEmail(inquilinoId: string, email: string) {
  const trimmed = email.trim().toLowerCase()
  if (!trimmed || !trimmed.includes("@")) {
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

export async function updateTenantUser(
  inquilinoId: string,
  localIds: string[],
  data: {
    nombre: string
    razonSocial: string
    nit: string
    telefono: string
    contactoNombre: string
    portalEmail: string
    businessEmail: string
    unitNumber: string
    entrada: string
    contractId?: string
    canonBase?: number
    descuentoPct?: number | null
    prontoPagoPct?: number | null
    fechaInicio?: string
    fechaFin?: string | null
    descripcionDescuentos?: string | null
  }
) {
  if (!data.nombre.trim()) return { error: "El nombre es obligatorio" }
  const portalEmail = data.portalEmail.trim().toLowerCase()
  if (portalEmail && !portalEmail.includes("@")) return { error: "Email portal inválido" }
  const bizEmail = data.businessEmail.trim().toLowerCase()
  if (bizEmail && !bizEmail.includes("@")) return { error: "Email de contacto inválido" }

  // Update inquilino
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

  // Sync portal email to auth if perfil exists
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

  // Update local fields — only if single local to avoid ambiguity
  if (localIds.length === 1) {
    const localUpdate: Record<string, string> = {}
    if (data.unitNumber.trim()) localUpdate.unidad = data.unitNumber.trim()
    if (data.entrada.trim()) localUpdate.entrada = data.entrada.trim()
    if (Object.keys(localUpdate).length > 0) {
      const { error: localError } = await supabaseAdmin
        .schema("v2")
        .from("locales")
        .update(localUpdate)
        .eq("id", localIds[0])
      if (localError) return { error: `Inquilino actualizado, pero error en local: ${localError.message}` }
    }
  }

  // Update contract fields if provided
  if (data.contractId && data.canonBase != null) {
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
      .eq("id", data.contractId)
    if (contractError) return { error: `Info guardada, pero error en contrato: ${contractError.message}` }
  }

  revalidatePath("/usuarios")
  return { success: true }
}

export async function createTenantAccount(inquilinoId: string) {
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
  await supabaseAdmin
    .schema("v2")
    .from("perfiles")
    .update({
      inquilino_id: inquilinoId,
      rol: "inquilino",
      nombre_completo: fullName,
      empresa_id: inquilino.empresa_id,
    })
    .eq("id", data.user.id)

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
