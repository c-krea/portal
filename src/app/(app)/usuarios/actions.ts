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

export async function updateTenantUser(
  tenantId: string,
  unitIds: string[],
  data: {
    nombre: string
    portalEmail: string
    unitNumber: string
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
  const email = data.portalEmail.trim().toLowerCase()
  if (email && !email.includes("@")) return { error: "Email inválido" }

  // Update tenant name + portal email
  const { error: tenantError } = await supabaseAdmin
    .from("tenants")
    .update({ nombre_corto: data.nombre.trim(), portal_email: email || null })
    .eq("id", tenantId)
  if (tenantError) return { error: tenantError.message }

  // Sync email to auth if account exists
  if (email) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("role", "tenant")
      .single()
    if (profile?.id) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        profile.id,
        { email }
      )
      if (authError) return { error: `Guardado, pero error en auth: ${authError.message}` }
    }
  }

  // Update unit number — only if single unit to avoid ambiguity
  const unitNum = data.unitNumber.trim()
  if (unitNum && unitIds.length === 1) {
    const { error: unitError } = await supabaseAdmin
      .from("units")
      .update({ unit_number: unitNum })
      .eq("id", unitIds[0])
    if (unitError) return { error: `Tenant actualizado, pero error en local: ${unitError.message}` }
  }

  // Update contract fields if provided
  if (data.contractId && data.canonBase != null) {
    const { error: contractError } = await supabaseAdmin
      .from("contracts")
      .update({
        canon_base:             data.canonBase,
        descuento_pct:          data.descuentoPct ?? null,
        pronto_pago_pct:        data.prontoPagoPct ?? null,
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
