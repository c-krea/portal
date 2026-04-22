"use server"

import { execute, supabaseAdmin } from "@/lib/db/executor"
import { ELECTRICITY_GROUPS } from "@/lib/data/electricity"
import { revalidatePath } from "next/cache"

export interface FacturaInput {
  electricity_group: string
  fecha_factura: string
  valor_factura: number
  kwh_factura: number
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

  const companies = await execute(`SELECT id FROM companies LIMIT 1`)
  const companyId = String(companies[0].id)

  const rows: FacturaInput[] = ELECTRICITY_GROUPS.map(({ group }) => ({
    electricity_group: group,
    fecha_factura:  String(formData.get(`fecha_${group}`) ?? ""),
    valor_factura:  Number(formData.get(`valor_${group}`) ?? 0),
    kwh_factura:    Number(formData.get(`kwh_${group}`)   ?? 0),
    notas:          String(formData.get(`notas_${group}`) ?? ""),
  }))

  for (const r of rows) {
    if (r.valor_factura <= 0 || r.kwh_factura <= 0) {
      const meta = ELECTRICITY_GROUPS.find(g => g.group === r.electricity_group)
      return { error: `Completa valor y kWh para ${meta?.direccion ?? r.electricity_group}` }
    }
  }

  const groupMeta = Object.fromEntries(
    ELECTRICITY_GROUPS.map(g => [g.group, g])
  )

  for (const r of rows) {
    const meta = groupMeta[r.electricity_group]
    const tarifa = r.valor_factura / r.kwh_factura

    const { error } = await supabaseAdmin
      .from("electricity_invoices")
      .upsert(
        {
          company_id:        companyId,
          periodo,
          electricity_group: r.electricity_group,
          direccion:         meta.direccion,
          proveedor:         meta.proveedor,
          fecha_factura:     r.fecha_factura || null,
          valor_factura:     r.valor_factura,
          kwh_factura:       r.kwh_factura,
          tarifa_kwh:        Math.round(tarifa * 100) / 100,
          notas:             r.notas || null,
          updated_at:        new Date().toISOString(),
        },
        { onConflict: "company_id,periodo,electricity_group" },
      )

    if (error) return { error: `Error guardando ${meta.direccion}: ${error.message}` }
  }

  revalidatePath("/medidores/facturas")
  return { success: true }
}
