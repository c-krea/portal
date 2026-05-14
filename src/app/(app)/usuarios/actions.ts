"use server"

import { supabaseAdmin, execute, executeDml, sqlStr } from "@/lib/db/executor"
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
  try {
    await executeDml(
      `UPDATE v2.inquilinos SET portal_email = ${sqlStr(trimmed)} WHERE id = '${inquilinoId}'::uuid`
    )
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }

  // 2. Sync auth.users if perfil exists
  const rows = await execute(
    `SELECT id FROM v2.perfiles WHERE inquilino_id = '${inquilinoId}'::uuid AND rol = 'inquilino' LIMIT 1`
  )

  if (rows[0]?.id) {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      String(rows[0].id),
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

  try {
    await executeDml(`
      UPDATE v2.inquilinos
      SET telefono       = ${sqlStr(data.telefono.trim() || null)},
          email_contacto = ${sqlStr(email || null)}
      WHERE id = '${inquilinoId}'::uuid
    `)
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }

  if (email) {
    const rows = await execute(
      `SELECT id FROM v2.perfiles WHERE inquilino_id = '${inquilinoId}'::uuid AND rol = 'inquilino' LIMIT 1`
    )
    if (rows[0]?.id) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        String(rows[0].id),
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

  const rows = await execute(
    `SELECT portal_email, nombre_corto, razon_social, empresa_id FROM v2.inquilinos WHERE id = '${inquilinoId}'::uuid LIMIT 1`
  )
  const inquilino = rows[0]
  if (!inquilino) return { error: "Inquilino no encontrado" }
  if (!inquilino.portal_email) return { error: "Sin email configurado" }

  const email    = String(inquilino.portal_email)
  const fullName = String(inquilino.nombre_corto ?? inquilino.razon_social)
  const empresaId = String(inquilino.empresa_id)

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
      createError.message.toLowerCase().includes("registered") ||
      createError.code === "user_already_exists"

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
  try {
    await executeDml(`
      INSERT INTO v2.perfiles (id, inquilino_id, rol, nombre_completo, empresa_id, email)
      VALUES (
        '${authUserId}'::uuid,
        '${inquilinoId}'::uuid,
        'inquilino',
        ${sqlStr(fullName)},
        '${empresaId}'::uuid,
        ${sqlStr(email)}
      )
      ON CONFLICT (id) DO UPDATE SET
        inquilino_id    = EXCLUDED.inquilino_id,
        rol             = EXCLUDED.rol,
        nombre_completo = EXCLUDED.nombre_completo,
        empresa_id      = EXCLUDED.empresa_id,
        email           = EXCLUDED.email
    `)
  } catch (e) {
    return { error: `Cuenta lista, pero error al vincular perfil: ${e instanceof Error ? e.message : String(e)}` }
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

  try {
    await executeDml(`
      UPDATE v2.perfiles
      SET nombre_completo = ${sqlStr(data.fullName.trim())},
          email           = ${sqlStr(email)},
          rol             = '${data.role}'
      WHERE id = '${userId}'::uuid
    `)
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }

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
