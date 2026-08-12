"use server"

import { supabaseAdmin, execute, executeDml, sqlStr } from "@/lib/db/executor"
import { getAuthUser } from "@/lib/auth/session"
import { getEmpresaCkreaId } from "@/lib/empresa"
import { getElectricityTarifaForUnit } from "@/lib/data/electricity"
import { uploadMeterPhoto } from "@/lib/r2/meter-photos"
import { getSignedDownloadUrl } from "@/lib/r2/files"
import { isValidPeriodo } from "@/lib/security/validators"
import { consumoDesdeLecturas, totalEnergia } from "@/lib/lectura-consumo"
import { revalidatePath } from "next/cache"
import { bustTags } from "@/lib/cache"
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
  const user = await getAuthUser()
  if (!user) return { error: "No autorizado" }

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

  const { unitId, periodo, lecturaActual, notas } = parsed.data

  const prevRows = await execute(`
    SELECT lectura_actual::numeric AS lectura_actual
    FROM v2.lecturas_medidor
    WHERE local_id = '${unitId}'::uuid
      AND periodo < '${periodo}'
    ORDER BY periodo DESC
    LIMIT 1
  `)
  const prevLectura = prevRows[0] ? Number(prevRows[0].lectura_actual) : null
  const { lecturaAnterior, kwh, esPrimeraLectura } = consumoDesdeLecturas(lecturaActual, prevLectura)

  if (!esPrimeraLectura && lecturaActual < lecturaAnterior) {
    return { error: "Lectura actual debe ser mayor o igual a la anterior" }
  }
  const rawUnitNumber  = (formData.get("unitNumber") as string | null) ?? ""
  const unitNumber     = rawUnitNumber.replace(/[^a-zA-Z0-9_-]/g, "")
  const rawMime        = (formData.get("fotoMime") as string | null) ?? "image/jpeg"
  const fotoMime       = (["image/jpeg", "image/png", "image/webp"] as string[]).includes(rawMime) ? rawMime : "image/jpeg"

  // Optional photo upload
  let fotoUrl: string | null = null
  let fotoKey: string | null = null
  const fotoBase64 = formData.get("fotoBase64") as string | null
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
      console.error("R2 upload error:", err)
      return { error: "Error subiendo la foto. Intente de nuevo." }
    }
  }

  try {
    const empresaId = await getEmpresaCkreaId()

    // Auto-lookup tarifa from the entered invoice for this period + unit's building group.
    // If no invoice exists yet, tarifa=0 and total=0; re-run registration once invoice is entered.
    const tarifa = await getElectricityTarifaForUnit(empresaId, unitId, periodo)
    const total = totalEnergia(kwh, tarifa)

    await executeDml(`
      INSERT INTO v2.lecturas_medidor
        (empresa_id, local_id, periodo, lectura_anterior, lectura_actual,
         kwh, tarifa_kwh, total_energia, notas, foto_url, foto_drive_id, submitted_by)
      VALUES (
        '${empresaId}'::uuid, '${unitId}'::uuid, '${periodo}',
        ${lecturaAnterior}, ${lecturaActual}, ${kwh},
        ${tarifa > 0 ? tarifa : 0}, ${total},
        ${sqlStr(notas ?? null)}, ${sqlStr(fotoUrl)}, ${sqlStr(fotoKey)},
        '${user.id}'::uuid
      )
      ON CONFLICT (local_id, periodo) DO UPDATE SET
        empresa_id       = EXCLUDED.empresa_id,
        lectura_anterior = EXCLUDED.lectura_anterior,
        lectura_actual   = EXCLUDED.lectura_actual,
        kwh              = EXCLUDED.kwh,
        tarifa_kwh       = EXCLUDED.tarifa_kwh,
        total_energia    = EXCLUDED.total_energia,
        notas            = EXCLUDED.notas,
        foto_url         = EXCLUDED.foto_url,
        foto_drive_id    = EXCLUDED.foto_drive_id,
        submitted_by     = EXCLUDED.submitted_by
    `)

    revalidatePath("/medidores")
    revalidatePath("/medidores/facturas")
    // total_energia changed → pagos electricity-dedup + medidores views recompute.
    bustTags("pagos", "medidores", "portal")

    const msg = esPrimeraLectura
      ? "Lectura inicial guardada como punto de partida. Este mes no se cobra."
      : tarifa > 0
        ? `Lectura registrada: ${kwh} kWh · $${total.toLocaleString("es-CO")}`
        : `Lectura registrada: ${kwh} kWh · costo pendiente (ingresa la factura del período primero, luego re-registra)`

    return { success: true, message: msg }
  } catch (e) {
    console.error(e)
    return { error: "Error al registrar lectura" }
  }
}

export async function getMeterPhotoSignedUrl(key: string): Promise<string | null> {
  if (!key || !key.startsWith("medidores/") || key.includes("..")) return null
  const user = await getAuthUser()
  if (!user) return null
  try {
    return await getSignedDownloadUrl(key)
  } catch {
    return null
  }
}
