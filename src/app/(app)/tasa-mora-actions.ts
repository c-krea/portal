"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAdminOrFinanzasAction } from "@/lib/auth/session"
import { executeDml } from "@/lib/db/executor"
import { bustTags } from "@/lib/cache"

// ── Monthly DIAN rate (interés de mora) — admin enters it each month ───────────
const tasaSchema = z.object({
  // Percent as the admin types it (e.g. 26.79 for 26,79%). Stored as decimal.
  tasaPct: z.coerce.number().positive("Ingrese la tasa").max(100, "Tasa demasiado alta"),
})

export type TasaState = { success?: boolean; error?: string; tasaEa?: number }

export async function guardarTasaMora(
  _prev: TasaState,
  formData: FormData,
): Promise<TasaState> {
  const auth = await requireAdminOrFinanzasAction()
  if ("error" in auth) return { error: auth.error }

  const parsed = tasaSchema.safeParse({ tasaPct: formData.get("tasaPct") })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Tasa inválida (ej: 26.79)" }
  }

  const tasaEa = parsed.data.tasaPct / 100
  try {
    await executeDml(`
      INSERT INTO v2.tasa_interes_mora (periodo, tasa_ea, actualizado_por)
      VALUES (to_char(CURRENT_DATE,'YYYY-MM'), ${tasaEa}, '${auth.profile.userId}'::uuid)
      ON CONFLICT (periodo) DO UPDATE
        SET tasa_ea = EXCLUDED.tasa_ea,
            actualizado_por = EXCLUDED.actualizado_por,
            updated_at = now()
    `)
    bustTags("mora", "portal")
    revalidatePath("/") // Resumen shows and edits the same rate
    return { success: true, tasaEa }
  } catch (e) {
    console.error(e)
    return { error: "Error al guardar la tasa. Intente de nuevo." }
  }
}
