"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export type ConfirmRecoveryState = {
  error?: string
}

export async function confirmRecovery(
  _prev: ConfirmRecoveryState,
  formData: FormData,
): Promise<ConfirmRecoveryState> {
  const token_hash = String(formData.get("token_hash") ?? "").trim()
  const type = String(formData.get("type") ?? "").trim()

  if (!token_hash || type !== "recovery") {
    return { error: "Este enlace no es válido. Solicita uno nuevo para continuar." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash })

  if (error) {
    return {
      error:
        "El enlace expiró o ya fue usado. Por seguridad cada enlace funciona una sola vez. Solicita uno nuevo abajo.",
    }
  }

  redirect("/update-password")
}
