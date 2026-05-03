"use server"

import { supabaseAdmin } from "@/lib/db/executor"
import { getEmpresaCkreaId } from "@/lib/empresa"
import { getElectricityTarifaForUnit } from "@/lib/data/electricity"
import { isValidPeriodo } from "@/lib/security/validators"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const schema = z.object({
  unitId:          z.string().uuid("Unidad requerida"),
  periodo:         z.string().refine(isValidPeriodo, "Período inválido (YYYY-MM)"),
  lecturaAnterior: z.coerce.number().min(0),
  lecturaActual:   z.coerce.number().min(0),
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
    notas:           formData.get("notas") || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const { unitId, periodo, lecturaAnterior, lecturaActual, notas } = parsed.data

  if (lecturaActual < lecturaAnterior) {
    return { error: "Lectura actual debe ser mayor o igual a la anterior" }
  }

  const kwh = Math.round((lecturaActual - lecturaAnterior) * 100) / 100

  try {
    const empresaId = await getEmpresaCkreaId()

    // Auto-lookup tarifa from the entered invoice for this period + unit's building group.
    // If no invoice exists yet, save without cost — it will be calculated when invoice arrives.
    const tarifa = await getElectricityTarifaForUnit(empresaId, unitId, periodo)
    const totalEnergia = tarifa > 0 ? Math.round(kwh * tarifa) : null

    const { error } = await supabaseAdmin
      .schema("v2")
      .from("lecturas_medidor")
      .upsert(
        {
          empresa_id:       empresaId,
          local_id:         unitId,
          periodo,
          lectura_anterior: lecturaAnterior,
          lectura_actual:   lecturaActual,
          kwh,
          tarifa_kwh:       tarifa > 0 ? tarifa : null,
          total_energia:    totalEnergia,
          notas:            notas ?? null,
        },
        { onConflict: "local_id,periodo" },
      )
    if (error) throw new Error(error.message)

    revalidatePath("/medidores")
    revalidatePath("/medidores/facturas")

    const msg = totalEnergia
      ? `Lectura registrada: ${kwh} kWh · $${totalEnergia.toLocaleString("es-CO")}`
      : `Lectura registrada: ${kwh} kWh · costo pendiente (ingresa la factura primero)`

    return { success: true, message: msg }
  } catch (e) {
    console.error(e)
    return { error: "Error al registrar lectura" }
  }
}
