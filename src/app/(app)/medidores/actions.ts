"use server"

import { supabaseAdmin } from "@/lib/db/executor"
import { getEmpresaCkreaId } from "@/lib/empresa"
import { getElectricityTarifaForUnit } from "@/lib/data/electricity"
import { uploadMeterPhoto } from "@/lib/r2/meter-photos"
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

  const kwh        = Math.round((lecturaActual - lecturaAnterior) * 100) / 100
  const unitNumber = (formData.get("unitNumber") as string | null) ?? ""

  // Optional photo upload
  let fotoUrl: string | null = null
  let fotoKey: string | null = null
  const fotoBase64 = formData.get("fotoBase64") as string | null
  const fotoMime   = (formData.get("fotoMime") as string | null) ?? "image/jpeg"
  if (fotoBase64) {
    try {
      const base64Data = fotoBase64.includes(",") ? fotoBase64.split(",")[1] : fotoBase64
      const buffer = Buffer.from(base64Data, "base64")
      const { key, url } = await uploadMeterPhoto(
        buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
        fotoMime,
        unitNumber,
        periodo,
      )
      fotoKey = key
      fotoUrl = url
    } catch (err) {
      console.error("R2 upload error:", err)
      return { error: "Error subiendo la foto. Intente de nuevo." }
    }
  }

  try {
    const empresaId = await getEmpresaCkreaId()

    // Auto-lookup tarifa from the entered invoice for this period + unit's building group.
    // If no invoice exists yet, tarifa=0 and total=0; re-run registration once invoice is entered.
    const tarifa = await getElectricityTarifaForUnit(empresaId, unitId, periodo)
    const totalEnergia = tarifa > 0 ? Math.round(kwh * tarifa) : 0

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
          tarifa_kwh:       tarifa > 0 ? tarifa : 0,
          total_energia:    totalEnergia,
          notas:            notas ?? null,
          foto_url:         fotoUrl,
          foto_drive_id:    fotoKey,
        },
        { onConflict: "local_id,periodo" },
      )
    if (error) throw new Error(error.message)

    revalidatePath("/medidores")
    revalidatePath("/medidores/facturas")

    const msg = tarifa > 0
      ? `Lectura registrada: ${kwh} kWh · $${totalEnergia.toLocaleString("es-CO")}`
      : `Lectura registrada: ${kwh} kWh · costo pendiente (ingresa la factura del período primero, luego re-registra)`

    return { success: true, message: msg }
  } catch (e) {
    console.error(e)
    return { error: "Error al registrar lectura" }
  }
}
