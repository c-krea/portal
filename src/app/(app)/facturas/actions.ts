"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

const schema = z.object({
  year:  z.coerce.number().int().min(2024).max(2030),
  month: z.coerce.number().int().min(1).max(12),
})

export type EmitState = { success?: boolean; error?: string }

/**
 * v2: facturas are emitted in Siesa ERP, not the portal. This stays a no-op
 * so the existing "Emitir" button doesn't error. Phase F removes the button.
 */
export async function emitirFactura(_id: string): Promise<EmitState> {
  return { error: "La emisión de facturas se realiza en Siesa ERP." }
}

export type GenerateState = {
  success?: boolean
  error?: string
  message?: string
  created?: number
  skipped?: number
  errors?: string[]
}

/**
 * v2: facturas come from siesa_raw via vista_facturas. Generation no longer
 * happens portal-side. Stub returns informative message; UI cleanup pending.
 */
export async function generarFacturas(
  _prev: GenerateState,
  formData: FormData,
): Promise<GenerateState> {
  const parsed = schema.safeParse({
    year:  formData.get("year"),
    month: formData.get("month"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Período inválido" }
  }

  const { year, month } = parsed.data
  const periodoStr = `${year}-${String(month).padStart(2, "0")}`

  revalidatePath("/facturas")
  return {
    success: true,
    message: `Las facturas del período ${periodoStr} se sincronizan automáticamente desde Siesa ERP. La generación manual ya no es necesaria.`,
    created: 0,
    skipped: 0,
    errors: [],
  }
}
