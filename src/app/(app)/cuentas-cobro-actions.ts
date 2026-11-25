"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAdminOrFinanzasAction } from "@/lib/auth/session"
import { expireTags } from "@/lib/cache"
import { getCuentasCobroFresh, guardarCuentasCobroDb } from "@/lib/data/cuentas-cobro"
import { currentPeriodo } from "@/lib/periodo"
import { isValidPeriodo } from "@/lib/security/validators"

const monto = z.coerce
  .number({ message: "Valor inválido" })
  .min(0, "El valor no puede ser negativo")
  .max(100_000_000_000, "Valor demasiado alto")

const schema = z.object({
  periodo: z.string().refine(isValidPeriodo, "Mes inválido"),
  ejecutado: monto,
  proyectado: monto,
})

export type CuentasCobroState = { success?: boolean; error?: string; sinCambios?: boolean }

export async function guardarCuentasCobro(
  _prev: CuentasCobroState,
  formData: FormData,
): Promise<CuentasCobroState> {
  const auth = await requireAdminOrFinanzasAction()
  if ("error" in auth) return { error: auth.error }

  const parsed = schema.safeParse({
    periodo: formData.get("periodo"),
    ejecutado: formData.get("ejecutado"),
    proyectado: formData.get("proyectado"),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }

  const { periodo, ejecutado, proyectado } = parsed.data
  if (periodo > currentPeriodo()) return { error: "No se puede registrar un mes futuro" }

  try {
    const actual = await getCuentasCobroFresh(periodo)
    if (Math.round(ejecutado) === actual.ejecutado && Math.round(proyectado) === actual.proyectado) {
      return { success: true, sinCambios: true }
    }
    await guardarCuentasCobroDb(periodo, { ejecutado, proyectado }, {
      id: auth.profile.userId,
      nombre: auth.profile.nombreCompleto,
      email: auth.profile.email,
    })
    expireTags("pagos")
    revalidatePath("/")
    return { success: true }
  } catch (e) {
    console.error("[cuentas-cobro] guardar", e)
    return { error: "Error al guardar. Intente de nuevo." }
  }
}
