"use server"

import { supabaseAdmin } from "@/lib/db/executor"
import { getEmpresaCkreaId } from "@/lib/empresa"
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
    const empresaId = await getEmpresaCkreaId()
    const contracts = await getContractsForProjection(empresaId, year)

    if (contracts.length === 0) {
      return { success: true, created: 0, skipped: 0, errors: [] }
    }

    let created = 0
    const errors: string[] = []

    for (const c of contracts) {
      try {
        const newCanon = Math.round(c.lastCanon * multiplier)
        const phasePct = c.descuentoPhasePct ?? 0
        const hastaMes = c.descuentoHastaMes ?? 0

        const rows = Array.from({ length: 12 }, (_, i) => {
          const m = i + 1
          const dctoPct = m <= hastaMes ? phasePct : 0
          const dctoVal = Math.round(newCanon * (dctoPct / 100))
          return {
            empresa_id:           empresaId,
            contrato_id:          c.contractId,
            local_id:             c.unitId,
            anio:                 year,
            mes:                  m,
            canon_proyectado:     String(newCanon),
            descuento_proyectado: String(dctoVal),
          }
        })

        const { error } = await supabaseAdmin
          .schema("v2")
          .from("proyecciones")
          .upsert(rows, { ignoreDuplicates: true, onConflict: "local_id,anio,mes" })
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

const UpdatePhaseSchema = z.object({
  contractId: z.string().uuid(),
  phasePct:   z.number().min(0).max(100).nullable(),
  hastaMes:   z.number().int().min(1).max(12).nullable(),
  year:       z.number().int().min(2025).max(2035),
})

export type UpdatePhaseState = {
  success: boolean
  error?: string
}

export async function updateContratoPhase(
  _prev: UpdatePhaseState,
  formData: FormData,
): Promise<UpdatePhaseState> {
  const rawPhase = formData.get("phasePct")
  const rawHasta = formData.get("hastaMes")
  const parsed = UpdatePhaseSchema.safeParse({
    contractId: String(formData.get("contractId") ?? ""),
    phasePct:   rawPhase === "" || rawPhase === null ? null : Number(rawPhase),
    hastaMes:   rawHasta === "" || rawHasta === null ? null : Number(rawHasta),
    year:       Number(formData.get("year")),
  })
  if (!parsed.success) return { success: false, error: "Parámetros inválidos" }

  const { contractId, phasePct, hastaMes, year } = parsed.data

  try {
    const { error: updErr } = await supabaseAdmin
      .schema("v2")
      .from("contratos")
      .update({
        descuento_phase_pct: phasePct,
        descuento_hasta_mes: hastaMes,
      })
      .eq("id", contractId)
    if (updErr) throw new Error(updErr.message)

    const { data: rows, error: selErr } = await supabaseAdmin
      .schema("v2")
      .from("proyecciones")
      .select("canon_proyectado, local_id, empresa_id")
      .eq("contrato_id", contractId)
      .eq("anio", year)
      .limit(1)
    if (selErr) throw new Error(selErr.message)
    if (!rows || rows.length === 0) {
      revalidatePath("/proyecciones")
      return { success: true }
    }

    const { canon_proyectado, local_id, empresa_id } = rows[0]
    const canon = Number(canon_proyectado)
    const phase = phasePct ?? 0
    const hasta = hastaMes ?? 0

    const newRows = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1
      const dctoPct = m <= hasta ? phase : 0
      const dctoVal = Math.round(canon * (dctoPct / 100))
      return {
        empresa_id,
        contrato_id:          contractId,
        local_id,
        anio:                 year,
        mes:                  m,
        canon_proyectado:     String(canon),
        descuento_proyectado: String(dctoVal),
      }
    })

    const { error: upErr } = await supabaseAdmin
      .schema("v2")
      .from("proyecciones")
      .upsert(newRows, { onConflict: "local_id,anio,mes" })
    if (upErr) throw new Error(upErr.message)

    revalidatePath("/proyecciones")
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) }
  }
}
