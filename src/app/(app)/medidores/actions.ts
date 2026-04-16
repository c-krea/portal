"use server"

import { db } from "@/lib/db/client"
import { meterReadings } from "@/lib/db/schema"
import { sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const schema = z.object({
  unitId:          z.string().uuid("Unidad requerida"),
  periodo:         z.string().regex(/^\d{4}-\d{2}$/, "Período inválido (YYYY-MM)"),
  lecturaAnterior: z.coerce.number().min(0),
  lecturaActual:   z.coerce.number().min(0),
  tarifaKwh:       z.coerce.number().positive("Tarifa debe ser mayor a 0"),
  notas:           z.string().optional(),
})

export type MedidorState = {
  success?: boolean
  error?: string
  message?: string
}

export async function registrarLectura(
  _prev: MedidorState,
  formData: FormData,
): Promise<MedidorState> {
  const parsed = schema.safeParse({
    unitId:          formData.get("unitId"),
    periodo:         formData.get("periodo"),
    lecturaAnterior: formData.get("lecturaAnterior"),
    lecturaActual:   formData.get("lecturaActual"),
    tarifaKwh:       formData.get("tarifaKwh"),
    notas:           formData.get("notas") || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const { unitId, periodo, lecturaAnterior, lecturaActual, tarifaKwh, notas } = parsed.data

  if (lecturaActual < lecturaAnterior) {
    return { error: "Lectura actual debe ser mayor o igual a la anterior" }
  }

  const kwh = Math.round((lecturaActual - lecturaAnterior) * 100) / 100
  const totalEnergia = Math.round(kwh * tarifaKwh)

  try {
    const companies = await db.execute(sql`SELECT id FROM companies LIMIT 1`)
    const companyId = String(companies[0].id)

    await db
      .insert(meterReadings)
      .values({
        companyId,
        unitId,
        periodo,
        lecturaAnterior: String(lecturaAnterior),
        lecturaActual:   String(lecturaActual),
        kwh:             String(kwh),
        tarifaKwh:       String(tarifaKwh),
        totalEnergia:    String(totalEnergia),
        notas:           notas ?? null,
      })
      .onConflictDoUpdate({
        target: [meterReadings.unitId, meterReadings.periodo],
        set: {
          lecturaAnterior: String(lecturaAnterior),
          lecturaActual:   String(lecturaActual),
          kwh:             String(kwh),
          tarifaKwh:       String(tarifaKwh),
          totalEnergia:    String(totalEnergia),
          notas:           notas ?? null,
        },
      })

    revalidatePath("/medidores")
    revalidatePath("/facturas")

    return {
      success: true,
      message: `Lectura registrada: ${kwh} kWh · $${totalEnergia.toLocaleString("es-CO")}`,
    }
  } catch (e) {
    console.error(e)
    return { error: "Error al registrar lectura" }
  }
}
