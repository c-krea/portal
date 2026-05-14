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
    return { error: `Auth error: ${error.message} (code: ${error.status ?? "?"})` }
  }

  redirect("/")
}
