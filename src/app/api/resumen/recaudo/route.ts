import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { getSessionProfile } from "@/lib/auth/session"
import { getEmpresaCkreaId } from "@/lib/empresa"
import { isValidPeriodo } from "@/lib/security/validators"
import { getRecaudoExport, type RecaudoTipo } from "@/lib/data/resumen-export"
import { buildSheet, COP_FORMAT, xlsxResponse, type Cell } from "@/lib/xlsx-sheet"

export const dynamic = "force-dynamic"

const TIPO_LABEL: Record<RecaudoTipo, string> = {
  facturado: "Recaudo facturado",
  mora: "Recaudo mora",
  intereses_mora: "Intereses de mora",
  mora_juridica: "Mora jurídica (no suma en el total)",
  servicios_publicos: "Servicios públicos (energía)",
}

// The tipos the /resumen "Total recaudo" card adds up.
const EN_TOTAL: RecaudoTipo[] = ["facturado", "mora", "intereses_mora"]

function decena(fecha: string): string {
  const d = Number(fecha.slice(8, 10))
  return d <= 10 ? "1–10" : d <= 20 ? "11–20" : "21–fin"
}

/**
 * GET /api/resumen/recaudo?periodo=YYYY-MM
 * Detail behind the /resumen "Total recaudo" card: one row per payment.
 */
export async function GET(req: NextRequest) {
  const profile = await getSessionProfile()
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (profile.rol === "inquilino") return NextResponse.json({ error: "Permiso denegado" }, { status: 403 })

  const periodo = req.nextUrl.searchParams.get("periodo")
  if (!isValidPeriodo(periodo)) return NextResponse.json({ error: "Período inválido" }, { status: 400 })

  const empresaId = await getEmpresaCkreaId()
  const rows = await getRecaudoExport(periodo, empresaId)

  const of = (tipos: RecaudoTipo[]) => rows.filter((r) => tipos.includes(r.tipo))
  const line = (label: string, tipos: RecaudoTipo[]): Cell[] => {
    const sel = of(tipos)
    return [label, sel.reduce((s, r) => s + r.valorFinal, 0), sel.length]
  }
  const todos: RecaudoTipo[] = [...EN_TOTAL, "servicios_publicos"]

  const resumen = buildSheet(
    [{ header: "Concepto", width: 48 }, { header: "Valor", width: 18, format: COP_FORMAT }, { header: "Pagos", width: 8 }],
    [
      ["Período", periodo, null],
      line("Recaudo facturado (≤ 30 días de la factura)", ["facturado"]),
      line("Recaudo mora (> 30 días, sin jurídica)", ["mora"]),
      line("Intereses de mora", ["intereses_mora"]),
      line("Total recaudo (igual a la tarjeta del Resumen)", EN_TOTAL),
      [null, null, null],
      line("Servicios públicos (energía)", ["servicios_publicos"]),
      line("Total recaudo + servicios públicos", todos),
      [null, null, null],
      line("Mora jurídica (fuera de los totales)", ["mora_juridica"]),
    ],
  )

  const detalle: Cell[][] = rows.map((r) => [
    r.fechaRecaudo,
    r.recibo,
    r.factura,
    r.nit,
    r.cliente,
    r.local,
    r.fechaFactura,
    r.vencimiento,
    r.diasAlPago,
    TIPO_LABEL[r.tipo],
    decena(r.fechaRecaudo),
    r.prontoPago,
    r.valorFinal,
  ])
  detalle.push([
    "TOTAL", null, null, null, null, null, null, null, null, null, null,
    rows.reduce((s, r) => s + r.prontoPago, 0),
    rows.reduce((s, r) => s + r.valorFinal, 0),
  ])

  const detalleWs = buildSheet(
    [
      { header: "Fecha recaudo", width: 13 },
      { header: "Recibo", width: 14 },
      { header: "Factura", width: 14 },
      { header: "NIT", width: 14 },
      { header: "Cliente", width: 36 },
      { header: "Local", width: 8 },
      { header: "Fecha factura", width: 13 },
      { header: "Vence (+30 días; vacío en energía)", width: 15 },
      { header: "Días factura → pago", width: 12 },
      { header: "Tipo", width: 32 },
      { header: "Decena", width: 8 },
      { header: "Descuento pronto pago", width: 16, format: COP_FORMAT },
      { header: "Valor recaudado", width: 16, format: COP_FORMAT },
    ],
    detalle,
  )
  detalleWs["!autofilter"] = { ref: `A1:M${rows.length + 1}` }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, resumen, "Resumen")
  XLSX.utils.book_append_sheet(wb, detalleWs, "Recaudo")
  return xlsxResponse(wb, `recaudo_${periodo}.xlsx`)
}
