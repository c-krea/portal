"use server"

import { supabaseAdmin } from "@/lib/db/executor"
import { getEmpresaCkreaId } from "@/lib/empresa"
import { ELECTRICITY_GROUPS } from "@/lib/data/electricity"
import { assertPeriodo, assertUuid } from "@/lib/security/validators"
import { revalidatePath } from "next/cache"

async function execDml(query: string) {
  const { error } = await supabaseAdmin.rpc("exec_dml", { q: query })
  if (error) throw new Error(`DML failed: ${error.message}\nQuery: ${query.slice(0, 300)}`)
}

export interface FacturaInput {
  electricity_group: string
  fecha_factura: string
  valor_factura: number
  tarifa_kwh: number
  notas: string
}

export interface SaveFacturasState {
  success?: boolean
  error?: string
}

export async function saveFacturasEnergia(
  _prev: SaveFacturasState,
  formData: FormData,
): Promise<SaveFacturasState> {
  const periodo = formData.get("periodo") as string
  if (!periodo) return { error: "Periodo requerido" }
  assertPeriodo(periodo)

  const empresaId = await getEmpresaCkreaId()
  assertUuid(empresaId)

  const rows: FacturaInput[] = ELECTRICITY_GROUPS.map(({ group }) => ({
    electricity_group: group,
    fecha_factura:  String(formData.get(`fecha_${group}`) ?? ""),
    valor_factura:  Number(formData.get(`valor_${group}`)  ?? 0),
    tarifa_kwh:     Number(formData.get(`tarifa_${group}`) ?? 0),
    notas:          String(formData.get(`notas_${group}`)  ?? ""),
  }))

  const filled = rows.filter((r) => r.valor_factura > 0 && r.tarifa_kwh > 0)
  const partial = rows.filter(
    (r) => (r.valor_factura > 0) !== (r.tarifa_kwh > 0),
  )
  if (partial.length > 0) {
    const meta = ELECTRICITY_GROUPS.find(g => g.group === partial[0].electricity_group)
    return { error: `Completa valor Y tarifa (o deja ambos vacíos) para ${meta?.direccion ?? partial[0].electricity_group}` }
  }
  if (filled.length === 0) {
    return { error: "Ingresa al menos una factura para guardar" }
  }

  const groupMeta = Object.fromEntries(
    ELECTRICITY_GROUPS.map(g => [g.group, g])
  )

  for (const r of filled) {
    const meta = groupMeta[r.electricity_group]
    const kwh_factura = Math.round((r.valor_factura / r.tarifa_kwh) * 100) / 100

    const { error } = await supabaseAdmin
      .schema("v2")
      .from("facturas_energia")
      .upsert(
        {
          empresa_id:        empresaId,
          periodo,
          grupo_energia:     r.electricity_group,
          direccion:         meta.direccion,
          proveedor:         meta.proveedor,
          fecha_factura:     r.fecha_factura || null,
          valor_factura:     r.valor_factura,
          kwh_factura:       kwh_factura,
          tarifa_kwh:        Math.round(r.tarifa_kwh * 100) / 100,
          notas:             r.notas || null,
          updated_at:        new Date().toISOString(),
        },
        { onConflict: "empresa_id,periodo,grupo_energia" },
      )

    if (error) return { error: `Error guardando ${meta.direccion}: ${error.message}` }
  }

  // Propagate new tarifas to existing lecturas for this period.
  // Recompute total_energia from kwh × tarifa so portal/admin views match the saved bills.
  const filledGroups = filled.map((r) => `'${r.electricity_group}'`).join(",")
  await execDml(`
    UPDATE v2.lecturas_medidor lm
    SET tarifa_kwh    = fe.tarifa_kwh,
        total_energia = ROUND(lm.kwh * fe.tarifa_kwh)
    FROM v2.facturas_energia fe,
         v2.locales u
    WHERE lm.empresa_id    = '${empresaId}'::uuid
      AND lm.periodo       = '${periodo}'
      AND lm.local_id      = u.id
      AND u.grupo_energia  = fe.grupo_energia
      AND fe.empresa_id    = '${empresaId}'::uuid
      AND fe.periodo       = '${periodo}'
      AND fe.grupo_energia IN (${filledGroups})
  `)

  revalidatePath("/medidores/facturas")
  revalidatePath("/medidores")
  return { success: true }
}
