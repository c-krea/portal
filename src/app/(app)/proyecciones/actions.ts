"use server"

import { db } from "@/lib/db/client"
import { projections } from "@/lib/db/schema"
import { sql } from "drizzle-orm"
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
    const companies = await db.execute(sql`SELECT id FROM companies LIMIT 1`)
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
          companyId,
          contractId:          c.contractId,
          unitId:              c.unitId,
          year,
          month:               i + 1,
          canonProyectado:     String(newCanon),
          descuentoProyectado: String(newDescuento),
          prontoPagoProyectado: String(newPP),
        }))

        await db
          .insert(projections)
          .values(rows)
          .onConflictDoNothing() // unique (unit_id, year, month) — safe idempotent

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
