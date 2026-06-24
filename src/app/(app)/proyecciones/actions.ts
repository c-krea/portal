"use server"

import { execute, executeDml } from "@/lib/db/executor"
import { getEmpresaCkreaId } from "@/lib/empresa"
import { revalidatePath } from "next/cache"
import { bustAllCaches } from "@/lib/cache"
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

        const vals = rows.map(r =>
          `('${r.empresa_id}'::uuid,'${r.contrato_id}'::uuid,'${r.local_id}'::uuid,${r.anio},${r.mes},${r.canon_proyectado},${r.descuento_proyectado})`
        ).join(",")
        await executeDml(`
          INSERT INTO v2.proyecciones
            (empresa_id,contrato_id,local_id,anio,mes,canon_proyectado,descuento_proyectado)
          VALUES ${vals}
          ON CONFLICT (local_id,anio,mes) DO NOTHING
        `)

        created += 12
      } catch (e) {
        errors.push(
          `${c.unitNumber} (${c.clienteName}): ${e instanceof Error ? e.message : String(e)}`,
        )
      }
    }

    revalidatePath("/proyecciones")
    // Projections feed the dashboard portfolio KPI + chart — refresh all caches.
    bustAllCaches()
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
    await executeDml(`
      UPDATE v2.contratos
      SET descuento_phase_pct = ${phasePct ?? "NULL"},
          descuento_hasta_mes = ${hastaMes ?? "NULL"}
      WHERE id = '${contractId}'::uuid
    `)

    const selRows = await execute(`
      SELECT canon_proyectado, local_id, empresa_id
      FROM v2.proyecciones
      WHERE contrato_id = '${contractId}'::uuid AND anio = ${year}
      LIMIT 1
    `)
    if (selRows.length === 0) {
      revalidatePath("/proyecciones")
      bustAllCaches()
      return { success: true }
    }

    const { canon_proyectado, local_id, empresa_id } = selRows[0]
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

    const vals2 = newRows.map(r =>
      `('${r.empresa_id}'::uuid,'${r.contrato_id}'::uuid,'${r.local_id}'::uuid,${r.anio},${r.mes},${r.canon_proyectado},${r.descuento_proyectado})`
    ).join(",")
    await executeDml(`
      INSERT INTO v2.proyecciones
        (empresa_id,contrato_id,local_id,anio,mes,canon_proyectado,descuento_proyectado)
      VALUES ${vals2}
      ON CONFLICT (local_id,anio,mes) DO UPDATE SET
        contrato_id          = EXCLUDED.contrato_id,
        canon_proyectado     = EXCLUDED.canon_proyectado,
        descuento_proyectado = EXCLUDED.descuento_proyectado
    `)

    revalidatePath("/proyecciones")
    bustAllCaches()
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) }
  }
}
