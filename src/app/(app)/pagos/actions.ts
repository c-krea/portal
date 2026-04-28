"use server"

export type ActionState = {
  success?: boolean
  error?: string
  message?: string
}

export async function registrarPago(
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  return {
    error: "Registro manual deshabilitado. Los pagos se sincronizan desde Siesa (cron diario 05:30 COT).",
  }
}
