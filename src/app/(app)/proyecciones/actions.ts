"use server"

import { execute, supabaseAdmin } from "@/lib/db/executor"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getContractsForProjection } from "@/lib/data/proyecciones"

const GenerateSchema = z.object({
  year:    z.number().int().min(2025).max(2035),
  ipcRate: z.number().min(0).max(100),
})

export type GenerateProyeccionesState = {
  success: boolean
  created?: number
  skipped?: number
  errors?: string[]
  error?: string
}

export async function generarProyecciones(
  _prev: GenerateProyeccionesState,
  formData: FormData,
): Promise<GenerateProyeccionesState> {
  const parsed = GenerateSchema.safeParse({
    year:    Number(formData.get("year")),
    ipcRate: Number(formData.get("ipcRate")),
  })
  if (!parsed.success) {
    return { success: false, error: "Parámetros inválidos" }
  }

  const { year, ipcRate } = parsed.data
  const multiplier = 1 + ipcRate / 100

  try {
    const companies = await execute(`SELECT id FROM companies LIMIT 1`)
    const companyId = String((companies as Array<Record<string, unknown>>)[0].id)

    const contracts = await getContractsForProjection(companyId, year)

    if (contracts.length === 0) {
      return { success: true, created: 0, skipped: 0, errors: [] }
    }

    let created = 0
    const errors: string[] = []

    for (const c of contracts) {
      try {
        const newCanon    = Math.round(c.lastCanon * multiplier)
        const descuentoPct = c.lastDescuentoPct > 0 ? c.lastDescuentoPct : c.descuentoPct
        const newDescuento = Math.round(newCanon * (descuentoPct / 100))
        const newPP        = Math.round((newCanon - newDescuento) * (c.prontoPagoPct / 100))

        const rows = Array.from({ length: 12 }, (_, i) => ({
          company_id:            companyId,
          contract_id:           c.contractId,
          unit_id:               c.unitId,
          year,
          month:                 i + 1,
          canon_proyectado:      String(newCanon),
          descuento_proyectado:  String(newDescuento),
          pronto_pago_proyectado: String(newPP),
        }))

        const { error } = await supabaseAdmin
          .from("projections")
          .upsert(rows, { ignoreDuplicates: true })
        if (error) throw new Error(error.message)

        created += 12
      } catch (e) {
        errors.push(
          `${c.unitNumber} (${c.clienteName}): ${e instanceof Error ? e.message : String(e)}`,
        )
      }
    }

    revalidatePath("/proyecciones")
    return { success: true, created: created / 12, skipped: 0, errors }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) }
  }
}
