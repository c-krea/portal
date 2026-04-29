"use server"

import { supabaseAdmin } from "@/lib/db/executor"
import { getEmpresaCkreaId } from "@/lib/empresa"
import { isValidPeriodo } from "@/lib/security/validators"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const schema = z.object({
  unitId:          z.string().uuid("Unidad requerida"),
  periodo:         z.string().refine(isValidPeriodo, "Período inválido (YYYY-MM)"),
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
    const empresaId = await getEmpresaCkreaId()

    const { error } = await supabaseAdmin
      .schema("v2")
      .from("lecturas_medidor")
      .upsert(
        {
          empresa_id:       empresaId,
          local_id:         unitId,
          periodo,
          lectura_anterior: String(lecturaAnterior),
          lectura_actual:   String(lecturaActual),
          kwh:              String(kwh),
          tarifa_kwh:       String(tarifaKwh),
          total_energia:    String(totalEnergia),
          notas:            notas ?? null,
        },
        { onConflict: "local_id,periodo" },
      )
    if (error) throw new Error(error.message)

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
