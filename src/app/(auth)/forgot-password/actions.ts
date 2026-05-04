"use server"

import { supabaseAdmin } from "@/lib/db/executor"
import { sendPasswordResetEmail } from "@/lib/email"
import { isValidEmail } from "@/lib/security/validators"

export type ForgotPasswordState = {
  error?: string
  success?: boolean
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://paycontrol.ckrea.co"

export async function requestPasswordReset(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()

  if (!email || !isValidEmail(email)) {
    return { error: "Ingrese un email válido" }
  }

  try {
    const redirectTo = `${SITE}/auth/confirm`
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    })

    // Always return success to avoid email enumeration
    if (error || !data?.properties?.action_link) {
      return { success: true }
    }

    await sendPasswordResetEmail({ to: email, resetUrl: data.properties.action_link })
    return { success: true }
  } catch {
    return { success: true }
  }
}
