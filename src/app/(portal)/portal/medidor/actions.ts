"use server"

import { getAuthUser } from "@/lib/auth/session"
import { execute, supabaseAdmin, executeDml, sqlStr } from "@/lib/db/executor"
import { getPortalProfile } from "@/lib/data/portal"
import { getElectricityTarifaForUnit } from "@/lib/data/electricity"
import { uploadMeterPhoto } from "@/lib/r2/meter-photos"
import { lecturaPeriodo, isLecturaWindow, lecturaDay } from "@/lib/periodo"
import { consumoDesdeLecturas, totalEnergia } from "@/lib/lectura-consumo"
import { revalidatePath } from "next/cache"
import { bustTags } from "@/lib/cache"
import { z } from "zod"

const schema = z.object({
  localId:       z.string().uuid("Local inválido"),
  lecturaActual: z.coerce.number().min(1, "Ingrese la lectura del contador"),
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
  const user = await getAuthUser()
  if (!user) return { error: "No autorizado" }

  const profile = await getPortalProfile(user.id)
  if (!profile) return { error: "Perfil no encontrado" }

  if (!isLecturaWindow()) {
    return { error: `El envío de lectura solo está habilitado el día ${lecturaDay()} de este mes.` }
  }

  const { companyId } = profile

  const parsed = schema.safeParse({
    localId:       formData.get("localId"),
    lecturaActual: formData.get("lecturaActual"),
    notas:         formData.get("notas") || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }

  const { localId, lecturaActual, notas } = parsed.data
  const periodo = lecturaPeriodo()

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
  const prevLectura = prevRows[0] ? Number(prevRows[0].lectura_actual) : null
  const { lecturaAnterior, kwh, esPrimeraLectura } = consumoDesdeLecturas(lecturaActual, prevLectura)
  // Prefer the invoice tarifa for THIS periodo (Excel formula: valor ÷ kWh per building).
  // If the invoice isn't entered yet, fall back to the previous reading's tarifa;
  // saveFacturasEnergia re-propagates the real tarifa once the invoice is entered.
  const invoiceTarifa = await getElectricityTarifaForUnit(companyId, unitId, periodo)
  const tarifaKwh = invoiceTarifa > 0
    ? invoiceTarifa
    : (prevRows[0] ? Number(prevRows[0].tarifa_kwh) : 0)

  if (!esPrimeraLectura && lecturaActual < lecturaAnterior) {
    return {
      error: `La lectura actual (${lecturaActual}) no puede ser menor a la anterior (${lecturaAnterior})`,
    }
  }

  const total = totalEnergia(kwh, tarifaKwh)

  // Trust the tenant's reading — accept as submitted, no automatic review.
  const validationStatus = "aprobado"

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

  try {
    await executeDml(`
      INSERT INTO v2.lecturas_medidor
        (empresa_id, local_id, periodo, lectura_anterior, lectura_actual,
         kwh, tarifa_kwh, total_energia, notas, foto_url, foto_drive_id,
         submitted_by, estado_validacion)
      VALUES (
        '${companyId}'::uuid, '${unitId}'::uuid, '${periodo}',
        ${lecturaAnterior}, ${lecturaActual}, ${kwh}, ${tarifaKwh}, ${total},
        ${sqlStr(notas ?? null)}, ${sqlStr(fotoUrl)}, ${sqlStr(fotoKey)},
        '${user.id}'::uuid, '${validationStatus}'
      )
      ON CONFLICT (local_id, periodo) DO UPDATE SET
        empresa_id        = EXCLUDED.empresa_id,
        lectura_anterior  = EXCLUDED.lectura_anterior,
        lectura_actual    = EXCLUDED.lectura_actual,
        kwh               = EXCLUDED.kwh,
        tarifa_kwh        = EXCLUDED.tarifa_kwh,
        total_energia     = EXCLUDED.total_energia,
        notas             = EXCLUDED.notas,
        foto_url          = EXCLUDED.foto_url,
        foto_drive_id     = EXCLUDED.foto_drive_id,
        submitted_by      = EXCLUDED.submitted_by,
        estado_validacion = EXCLUDED.estado_validacion
    `)
  } catch {
    return { error: "Error al guardar la lectura. Intente de nuevo." }
  }

  revalidatePath("/portal")
  revalidatePath("/portal/medidor")
  revalidatePath("/medidores")
  // total_energia changed → pagos electricity-dedup + medidores views recompute.
  bustTags("pagos", "medidores", "portal")

  const message = esPrimeraLectura
    ? "Lectura inicial guardada. Este mes no se cobra — queda como punto de partida."
    : `Lectura enviada correctamente (${kwh.toLocaleString("es-CO")} kWh).`

  return {
    success: true,
    fotoUrl: fotoUrl ?? undefined,
    message,
  }
}
