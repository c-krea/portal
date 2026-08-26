"use server"

import { buildRecoveryUrl } from "@/lib/auth/recovery-link"
import { supabaseAdmin } from "@/lib/db/executor"
import { sendPasswordResetEmail } from "@/lib/email"
import { isValidEmail } from "@/lib/security/validators"

export type ForgotPasswordState = {
  error?: string
  success?: boolean
}

export async function requestPasswordReset(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()

  if (!email || !isValidEmail(email)) {
    return { error: "Ingrese un email válido" }
  }

  try {
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
    })

    // Always return success to avoid email enumeration
    const resetUrl = buildRecoveryUrl(data?.properties?.hashed_token ?? "")
    if (error || !resetUrl) {
      return { success: true }
    }

    await sendPasswordResetEmail({ to: email, resetUrl })
    return { success: true }
  } catch {
    return { success: true }
  }
}
