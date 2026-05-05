import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { execute } from "@/lib/db/executor"
import { getEmpresaCkreaId } from "@/lib/empresa"
import { isValidPeriodo } from "@/lib/security/validators"
import { getElectricityInvoices, ELECTRICITY_GROUPS } from "@/lib/data/electricity"

export const dynamic = "force-dynamic"

function periodoLabel(periodo: string): string {
  const [year, month] = periodo.split("-")
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString("es-CO", { month: "long", year: "numeric" })
}

function cop(n: number | null): string {
  if (n == null || n === 0) return ""
  return `$ ${Math.round(n).toLocaleString("es-CO")}`
}

function tarifaStr(valor: number, kwh: number): string {
  if (!valor || !kwh) return ""
  return `$ ${(valor / kwh).toLocaleString("es-CO", { maximumFractionDigits: 2 })}/kWh`
}

const GRUPO_LABEL = Object.fromEntries(
  ELECTRICITY_GROUPS.map((g) => [g.group, g.direccion]),
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const rawPeriodo = searchParams.get("periodo")

  if (!isValidPeriodo(rawPeriodo)) {
    return NextResponse.json({ error: "Período inválido" }, { status: 400 })
  }

  const periodo = rawPeriodo!
  const empresaId = await getEmpresaCkreaId()
  const label = periodoLabel(periodo)

  const [invoices, units] = await Promise.all([
    // Uses ERP fallback + computed kWh from readings
    getElectricityInvoices(empresaId, periodo),

    execute(`
      SELECT
        u.unidad,
        COALESCE(t.nombre_corto, t.razon_social) AS tenant_name,
        COALESCE(u.grupo_energia, '')             AS grupo,
        lm.lectura_anterior,
        lm.lectura_actual,
        lm.kwh::numeric                           AS kwh,
        lm.total_energia::numeric                 AS total_energia
      FROM v2.locales u
      LEFT JOIN v2.contratos c
             ON c.local_id   = u.id
            AND c.empresa_id = '${empresaId}'::uuid
            AND c.estado IN ('activo', 'critico')
      LEFT JOIN v2.inquilinos t ON c.inquilino_id = t.id
      LEFT JOIN v2.lecturas_medidor lm
             ON lm.local_id = u.id AND lm.periodo = '${periodo}'
      WHERE u.empresa_id = '${empresaId}'::uuid
        AND u.tiene_medidor = true
      ORDER BY u.unidad
    `),
  ])

  // --- Sheet 1: Facturas de Energía ---
  const facturaRows: Record<string, string | number>[] = invoices.map((inv) => ({
    "Dirección":      inv.direccion,
    "Proveedor":      inv.proveedor,
    "Fecha Factura":  inv.fecha_factura ?? "",
    "Valor (COP)":    cop(inv.valor_factura),
    "kWh":            inv.kwh_factura || "",
    "Tarifa":         tarifaStr(inv.valor_factura, inv.kwh_factura),
  }))

  const totalValor = invoices.reduce((s, inv) => s + inv.valor_factura, 0)
  const totalKwh   = invoices.reduce((s, inv) => s + inv.kwh_factura, 0)
  facturaRows.push({
    "Dirección":     "TOTAL",
    "Proveedor":     "",
    "Fecha Factura": "",
    "Valor (COP)":   cop(totalValor),
    "kWh":           totalKwh || "",
    "Tarifa":        tarifaStr(totalValor, totalKwh),
  })

  // --- Sheet 2: Consumo por Local ---
  type Row = Record<string, unknown>
  let sumKwh = 0, sumTotal = 0

  const localRows: Record<string, string | number>[] = (units as Row[]).map((r) => {
    const kwh   = r.kwh           != null ? Number(r.kwh)           : null
    const total = r.total_energia != null ? Number(r.total_energia) : null
    if (kwh)   sumKwh   += kwh
    if (total) sumTotal += total
    return {
      "Local":          String(r.unidad),
      "Inquilino":      r.tenant_name ? String(r.tenant_name) : "",
      "Dirección":      GRUPO_LABEL[String(r.grupo)] ?? String(r.grupo),
      "Lec. Anterior":  r.lectura_anterior != null ? Number(r.lectura_anterior) : "",
      "Lec. Actual":    r.lectura_actual   != null ? Number(r.lectura_actual)   : "",
      "kWh":            kwh   ?? "",
      "Total (COP)":    total != null ? cop(total) : "",
    }
  })

  localRows.push({
    "Local":         "TOTAL",
    "Inquilino":     "",
    "Dirección":     "",
    "Lec. Anterior": "",
    "Lec. Actual":   "",
    "kWh":           sumKwh   || "",
    "Total (COP)":   cop(sumTotal),
  })

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(facturaRows), "Facturas Energía")
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(localRows),   "Consumo por Local")

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="energia_${periodo}.xlsx"`,
    },
  })
}
