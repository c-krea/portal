"use server"

import { createClient } from "@/lib/supabase/server"
import { execute, supabaseAdmin } from "@/lib/db/executor"
import { getPortalProfile } from "@/lib/data/portal"
import { uploadMeterPhoto } from "@/lib/google-drive"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const schema = z.object({
  periodo:      z.string().regex(/^\d{4}-\d{2}$/),
  lecturaActual: z.coerce.number().min(0, "Ingrese la lectura del contador"),
  notas:        z.string().optional(),
})

export type MedidorPortalState = {
  success?: boolean
  error?: string
  message?: string
}

export async function submitLectura(
  _prev: MedidorPortalState,
  formData: FormData,
): Promise<MedidorPortalState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }

  // Look up unitId + companyId server-side — never trust client
  const profile = await getPortalProfile(user.id)
  if (!profile) return { error: "Perfil no encontrado" }

  const { unitId, companyId } = profile

  const parsed = schema.safeParse({
    periodo:       formData.get("periodo"),
    lecturaActual: formData.get("lecturaActual"),
    notas:         formData.get("notas") || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }

  const { periodo, lecturaActual, notas } = parsed.data

  // Get previous reading
  const prevRows = await execute(`
    SELECT lectura_actual::numeric AS lectura_actual, tarifa_kwh::numeric AS tarifa_kwh
    FROM meter_readings
    WHERE unit_id = '${unitId}'
    ORDER BY periodo DESC
    LIMIT 1
  `)
  const lecturaAnterior = prevRows[0] ? Number(prevRows[0].lectura_actual) : 0
  const tarifaKwh = prevRows[0] ? Number(prevRows[0].tarifa_kwh) : 0

  if (lecturaActual < lecturaAnterior) {
    return {
      error: `La lectura actual (${lecturaActual}) no puede ser menor a la anterior (${lecturaAnterior})`,
    }
  }

  const kwh = Math.round((lecturaActual - lecturaAnterior) * 100) / 100
  const totalEnergia = Math.round(kwh * tarifaKwh)

  // Promedio 3 meses para validación automática
  const promRows = await execute(`
    SELECT AVG(kwh::numeric) AS promedio
    FROM (
      SELECT kwh FROM meter_readings
      WHERE unit_id = '${unitId}' AND periodo < '${periodo}'
      ORDER BY periodo DESC LIMIT 3
    ) t
  `)
  const promedio3m = promRows[0]?.promedio != null ? Number(promRows[0].promedio) : null

  let validationStatus: string
  if (promedio3m === null || promedio3m === 0) {
    validationStatus = "aprobado"
  } else {
    const pct = Math.abs((kwh - promedio3m) / promedio3m)
    validationStatus = pct <= 0.1 ? "aprobado" : "revision"
  }

  // Foto upload → Google Drive (base64 from client)
  let fotoUrl: string | null = null
  let fotoDriveId: string | null = null
  const fotoBase64 = formData.get("fotoBase64") as string | null
  const fotoMime = (formData.get("fotoMime") as string | null) ?? "image/jpeg"
  if (fotoBase64) {
    try {
      const base64Data = fotoBase64.includes(",") ? fotoBase64.split(",")[1] : fotoBase64
      const buffer = Buffer.from(base64Data, "base64")
      const { fileId, url } = await uploadMeterPhoto(
        buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
        fotoMime,
        profile.unitNumber,
        periodo,
      )
      fotoDriveId = fileId
      fotoUrl = url
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error("Drive upload error:", msg)
      return { error: `Error subiendo foto: ${msg}` }
    }
  }

  const { error } = await supabaseAdmin
    .from("meter_readings")
    .upsert(
      {
        company_id:        companyId,
        unit_id:           unitId,
        periodo,
        lectura_anterior:  String(lecturaAnterior),
        lectura_actual:    String(lecturaActual),
        kwh:               String(kwh),
        tarifa_kwh:        String(tarifaKwh),
        total_energia:     String(totalEnergia),
        notas:             notas ?? null,
        foto_url:          fotoUrl,
        foto_drive_id:     fotoDriveId,
        submitted_by:      user.id,
        validation_status: validationStatus,
      },
      { onConflict: "unit_id,periodo" },
    )
  if (error) return { error: "Error al guardar la lectura. Intente de nuevo." }

  revalidatePath("/portal")
  revalidatePath("/portal/medidor")
  revalidatePath("/medidores")

  return {
    success: true,
    message:
      validationStatus === "aprobado"
        ? `Lectura enviada y aprobada automáticamente (${kwh.toLocaleString("es-CO")} kWh).`
        : `Lectura enviada (${kwh.toLocaleString("es-CO")} kWh). El administrador la revisará en los próximos días.`,
  }
}
