"use server"

import { getEmpresaCkreaId } from "@/lib/empresa"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { runInterestAccrual, type InterestAccrualSummary } from "@/lib/interest-engine"
import { createClient } from "@/lib/supabase/server"
import { execute } from "@/lib/db/executor"

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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }
  const roleRows = await execute(`SELECT rol FROM v2.perfiles WHERE id = '${user.id}'::uuid LIMIT 1`)
  const rol = String(roleRows[0]?.rol ?? "")
  if (!["admin", "finanzas"].includes(rol)) return { error: "Permiso denegado" }

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
