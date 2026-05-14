"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export type UpdatePasswordState = {
  error?: string
}

export async function updatePassword(
  _prev: UpdatePasswordState,
  formData: FormData,
): Promise<UpdatePasswordState> {
  const password = String(formData.get("password") ?? "")
  const confirm = String(formData.get("confirm") ?? "")

  if (!password || password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres" }
  }
  if (password !== confirm) {
    return { error: "Las contraseñas no coinciden" }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes("different from the old password") || msg.includes("same as the old"))
      return { error: "La nueva contraseña debe ser diferente a la actual." }
    if (msg.includes("weak") || msg.includes("too short"))
      return { error: "La contraseña es muy débil. Usa al menos 8 caracteres." }
    if (msg.includes("expired") || msg.includes("already") || error.status === 401)
      return { error: "El enlace expiró o ya fue usado. Solicita uno nuevo." }
    return { error: "No se pudo actualizar la contraseña. Intenta de nuevo." }
  }

  redirect("/")
}
