"use server"

import { createClient } from "@/lib/supabase/server"
import { execute, supabaseAdmin } from "@/lib/db/executor"
import { getPortalProfile } from "@/lib/data/portal"
import { uploadMeterPhoto } from "@/lib/r2/meter-photos"
import { isValidPeriodo } from "@/lib/security/validators"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const schema = z.object({
  periodo:       z.string().refine(isValidPeriodo),
  localId:       z.string().uuid("Local inválido"),
  lecturaActual: z.coerce.number().min(0, "Ingrese la lectura del contador"),
  notas:         z.string().optional(),
})

export type MedidorPortalState = {
  success?: boolean
  error?: string
  message?: string
  fotoUrl?: string
}

export async function submitLectura(
  _prev: MedidorPortalState,
  formData: FormData,
): Promise<MedidorPortalState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }

  const profile = await getPortalProfile(user.id)
  if (!profile) return { error: "Perfil no encontrado" }

  if (new Date().getDate() !== 9) return { error: "El envío de lectura solo está habilitado el día 9 de cada mes." }

  const { companyId } = profile

  const parsed = schema.safeParse({
    periodo:       formData.get("periodo"),
    localId:       formData.get("localId"),
    lecturaActual: formData.get("lecturaActual"),
    notas:         formData.get("notas") || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }

  const { periodo, localId, lecturaActual, notas } = parsed.data

  // Security: localId must belong to this tenant
  if (!profile.allUnitIds.includes(localId)) return { error: "Local no autorizado" }

  const unitId = localId

  // Block resubmission of already-approved readings
  const existingRows = await execute(`
    SELECT estado_validacion FROM v2.lecturas_medidor
    WHERE local_id = '${unitId}'::uuid AND periodo = '${periodo}'
    LIMIT 1
  `)
  if (existingRows[0]?.estado_validacion === "aprobado") {
    return { error: "Esta lectura ya fue aprobada. Contacta a la administración si necesitas corregirla." }
  }
  const unitNumber = profile.allUnits[profile.allUnitIds.indexOf(localId)] ?? profile.unitNumber

  const prevRows = await execute(`
    SELECT lectura_actual::numeric AS lectura_actual, tarifa_kwh::numeric AS tarifa_kwh
    FROM v2.lecturas_medidor
    WHERE local_id = '${unitId}'::uuid
      AND periodo < '${periodo}'
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
  const totalEnergia = Math.round(kwh * tarifaKwh / 50) * 50

  // Hybrid validation: same-month seasonal avg (primary) + 3m avg (fallback)
  const mes = periodo.split("-")[1]
  const [seasonRows, trend3mRows] = await Promise.all([
    execute(`
      SELECT AVG(kwh::numeric) AS promedio, COUNT(*) AS cnt
      FROM v2.lecturas_medidor
      WHERE local_id = '${unitId}'::uuid
        AND SUBSTRING(periodo, 6, 2) = '${mes}'
        AND periodo < '${periodo}'
    `),
    execute(`
      SELECT AVG(kwh::numeric) AS promedio
      FROM v2.lecturas_medidor
      WHERE local_id = '${unitId}'::uuid AND periodo < '${periodo}'
    `),
  ])

  const seasonalAvg =
    seasonRows[0]?.promedio != null && Number(seasonRows[0].cnt) >= 1 && Number(seasonRows[0].promedio) > 0
      ? Number(seasonRows[0].promedio)
      : null
  const avg3m = trend3mRows[0]?.promedio != null ? Number(trend3mRows[0].promedio) : null
  const expected = seasonalAvg ?? avg3m

  let validationStatus: "aprobado" | "revision" | "critico"
  let expectedKwh: number | null = null
  let pctDiff: number | null = null

  if (kwh === 0) {
    validationStatus = "critico"
  } else if (expected === null || expected === 0) {
    validationStatus = "aprobado"
  } else {
    const pct = Math.abs((kwh - expected) / expected)
    pctDiff = Math.round(pct * 100)
    expectedKwh = Math.round(expected)
    validationStatus = pct <= 0.20 ? "aprobado" : pct <= 0.40 ? "revision" : "critico"
  }

  let fotoUrl: string | null = null
  let fotoKey: string | null = null
  const fotoBase64 = formData.get("fotoBase64") as string | null
  const rawMime = (formData.get("fotoMime") as string | null) ?? "image/jpeg"
  const fotoMime = (["image/jpeg", "image/png", "image/webp"] as string[]).includes(rawMime) ? rawMime : "image/jpeg"
  if (fotoBase64) {
    try {
      const base64Data = fotoBase64.includes(",") ? fotoBase64.split(",")[1] : fotoBase64
      const buffer = Buffer.from(base64Data, "base64")
      const { key } = await uploadMeterPhoto(
        buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
        fotoMime,
        unitNumber,
        periodo,
      )
      fotoKey = key
      fotoUrl = key
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error("R2 upload error:", msg)
      return { error: `Error subiendo foto: ${msg}` }
    }
  }

  const { error } = await supabaseAdmin
    .schema("v2")
    .from("lecturas_medidor")
    .upsert(
      {
        empresa_id:         companyId,
        local_id:           unitId,
        periodo,
        lectura_anterior:   String(lecturaAnterior),
        lectura_actual:     String(lecturaActual),
        kwh:                String(kwh),
        tarifa_kwh:         String(tarifaKwh),
        total_energia:      String(totalEnergia),
        notas:              notas ?? null,
        foto_url:           fotoUrl,
        foto_drive_id:      fotoKey,
        submitted_by:       user.id,
        estado_validacion:  validationStatus,
      },
      { onConflict: "local_id,periodo" },
    )
  if (error) return { error: "Error al guardar la lectura. Intente de nuevo." }

  revalidatePath("/portal")
  revalidatePath("/portal/medidor")
  revalidatePath("/medidores")

  const kwhFmt = kwh.toLocaleString("es-CO")
  let message: string
  if (validationStatus === "aprobado") {
    message = `Lectura enviada y aprobada automáticamente (${kwhFmt} kWh).`
  } else if (validationStatus === "revision") {
    const dir = expectedKwh !== null && kwh > expectedKwh ? "por encima" : "por debajo"
    message = `Lectura enviada (${kwhFmt} kWh). Está ${pctDiff}% ${dir} del histórico esperado (${expectedKwh?.toLocaleString("es-CO")} kWh). El administrador la revisará.`
  } else {
    message = kwh === 0
      ? `Lectura enviada (0 kWh). Consumo cero requiere revisión manual.`
      : `Lectura enviada (${kwhFmt} kWh). Difiere significativamente del histórico (${expectedKwh?.toLocaleString("es-CO")} kWh esperados, diferencia: ${pctDiff}%). Se revisará con urgencia.`
  }

  return {
    success: true,
    fotoUrl: fotoUrl ?? undefined,
    message,
  }
}
