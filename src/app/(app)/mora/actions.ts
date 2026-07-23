"use server"

import { getEmpresaCkreaId } from "@/lib/empresa"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { runInterestAccrual, type InterestAccrualSummary } from "@/lib/interest-engine"
import { requireAdminOrFinanzasAction } from "@/lib/auth/session"
import { executeDml } from "@/lib/db/executor"
import { bustTags } from "@/lib/cache"

const schema = z.object({
  accrualDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
})

export type AccrualState = {
  success?: boolean
  error?: string
  summary?: InterestAccrualSummary
}

export async function calcularIntereses(
  _prev: AccrualState,
  formData: FormData,
): Promise<AccrualState> {
  const auth = await requireAdminOrFinanzasAction()
  if ("error" in auth) return { error: auth.error }

  const parsed = schema.safeParse({
    accrualDate: formData.get("accrualDate"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Fecha inválida" }
  }

  try {
    const empresaId = await getEmpresaCkreaId()

    const summary = await runInterestAccrual(empresaId, parsed.data.accrualDate)

    revalidatePath("/mora")
    revalidatePath("/facturas")
    revalidatePath("/locales")
    // NOTE: runInterestAccrual is currently a no-op (interest-engine writes nothing),
    // so no data actually changed — nothing to bust. When the engine persists real
    // accruals, add: bustTags("mora", "dashboard") (+ "facturas" once it is cached).

    return { success: true, summary }
  } catch (e) {
    console.error(e)
    return { error: "Error al calcular intereses. Intente de nuevo." }
  }
}

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
    revalidatePath("/mora")
    return { success: true, tasaEa }
  } catch (e) {
    console.error(e)
    return { error: "Error al guardar la tasa. Intente de nuevo." }
  }
}
