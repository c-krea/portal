import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { getSessionProfile } from "@/lib/auth/session"
import { getEmpresaCkreaId } from "@/lib/empresa"
import { isValidPeriodo } from "@/lib/security/validators"
import { getRecaudoExport, type RecaudoExportRow, type RecaudoTipo } from "@/lib/data/resumen-export"
import { getCuentasCobroFresh, getCuentasCobroHistorialFresh } from "@/lib/data/cuentas-cobro"
import { buildSheet, COP_FORMAT, xlsxResponse, type Cell } from "@/lib/xlsx-sheet"

export const dynamic = "force-dynamic"

const TIPO_LABEL: Record<RecaudoTipo, string> = {
  facturado: "Canon · recaudo facturado",
  anticipo: "Canon · anticipo sin factura",
  intereses_mora: "Intereses de mora",
  mora: "Mora",
  servicios_publicos: "Luz · servicios públicos (energía)",
  cuentas_cobro: "Cuentas de cobro (registro manual)",
  deposito: "Depósito RKD (no suma en el total)",
  mora_juridica: "Mora jurídica (no suma en el total)",
}

// Same split as the /resumen cards: an interest invoice paid within 30 days
// of its invoice counts in Canon, a late one in Mora (getResumenKPIs).
function card(r: RecaudoExportRow): "canon" | "mora" | "luz" | "cuentas" | null {
  switch (r.tipo) {
    case "facturado":
    case "anticipo":
      return "canon"
    case "mora":
      return "mora"
    case "intereses_mora":
      return r.vencimiento != null && r.fechaRecaudo > r.vencimiento ? "mora" : "canon"
    case "servicios_publicos":
      return "luz"
    case "cuentas_cobro":
      return "cuentas"
    default:
      return null // deposito, mora_juridica: listed, outside the total
  }
}

const CARD_LABEL = { canon: "Canon", mora: "Mora", luz: "Luz", cuentas: "Cuentas de cobro" } as const

function decena(fecha: string): string {
  const d = Number(fecha.slice(8, 10))
  return d <= 10 ? "1–10" : d <= 20 ? "11–20" : "21–fin"
}

// 'YYYY-MM-DD' in Bogotá for a timestamp.
function fechaBogota(ts: string): string {
  return new Date(ts).toLocaleDateString("en-CA", { timeZone: "America/Bogota" })
}

/**
 * GET /api/resumen/recaudo?periodo=YYYY-MM
 * Everything behind the /resumen "Recaudo total": one row per payment (canon,
 * anticipos, mora, intereses, luz), the month's cuentas de cobro, plus the
 * depósito and mora jurídica rows that sit outside the total.
 */
export async function GET(req: NextRequest) {
  const profile = await getSessionProfile()
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (profile.rol === "inquilino") return NextResponse.json({ error: "Permiso denegado" }, { status: 403 })

  const periodo = req.nextUrl.searchParams.get("periodo")
  if (!isValidPeriodo(periodo)) return NextResponse.json({ error: "Período inválido" }, { status: 400 })

  const empresaId = await getEmpresaCkreaId()
  const [pagos, cuentas, historial] = await Promise.all([
    getRecaudoExport(periodo, empresaId),
    getCuentasCobroFresh(periodo),
    getCuentasCobroHistorialFresh(periodo),
  ])

  // Cuentas de cobro have no SIESA document: one row with the month's
  // ejecutado, and the fields a receipt would carry filled with the last
  // user who registered it.
  const rows: RecaudoExportRow[] = [...pagos]
  const ultimo = historial[0]
  if (cuentas.ejecutado !== 0 || ultimo) {
    const usuario = ultimo?.usuarioNombre ?? "Sin registrar"
    rows.push({
      fechaRecaudo: ultimo ? fechaBogota(ultimo.createdAt) : `${periodo}-01`,
      recibo: `Registrado por ${usuario}`,
      factura: "Cuenta de cobro",
      nit: usuario,
      cliente: usuario,
      local: null,
      fechaFactura: null,
      vencimiento: null,
      diasAlPago: null,
      tipo: "cuentas_cobro",
      valorAplicado: cuentas.ejecutado,
      prontoPago: 0,
      valorFinal: cuentas.ejecutado,
    })
  }

  const sumWhere = (f: (r: RecaudoExportRow) => boolean) => {
    const sel = rows.filter(f)
    return { valor: sel.reduce((s, r) => s + r.valorFinal, 0), n: sel.length }
  }
  const line = (label: string, f: (r: RecaudoExportRow) => boolean): Cell[] => {
    const { valor, n } = sumWhere(f)
    return [label, valor, n]
  }
  const ofTipo = (...t: RecaudoTipo[]) => (r: RecaudoExportRow) => t.includes(r.tipo)
  const ofCard = (c: keyof typeof CARD_LABEL) => (r: RecaudoExportRow) => card(r) === c

  const resumen = buildSheet(
    [{ header: "Concepto", width: 52 }, { header: "Valor", width: 18, format: COP_FORMAT }, { header: "Registros", width: 10 }],
    [
      ["Período", periodo, null],
      [null, null, null],
      line("Canon", ofCard("canon")),
      line("   · Recaudo facturado (≤ 30 días de la factura)", ofTipo("facturado")),
      line("   · Intereses de mora pagados a tiempo", (r) => r.tipo === "intereses_mora" && card(r) === "canon"),
      line("   · Anticipos sin factura aplicada", ofTipo("anticipo")),
      line("Mora (> 30 días, sin jurídica)", ofCard("mora")),
      line("   · Recaudo mora", ofTipo("mora")),
      line("   · Intereses de mora pagados tarde", (r) => r.tipo === "intereses_mora" && card(r) === "mora"),
      line("Luz (servicios públicos)", ofCard("luz")),
      line(`Cuentas de cobro${ultimo ? ` (registró ${ultimo.usuarioNombre})` : ""}`, ofCard("cuentas")),
      line("Total recaudo (igual a la tarjeta del Resumen)", (r) => card(r) != null),
      [null, null, null],
      line("Depósito RKD (fuera del total)", ofTipo("deposito")),
      line("Mora jurídica (fuera del total)", ofTipo("mora_juridica")),
    ],
  )

  const detalle: Cell[][] = rows.map((r) => {
    const c = card(r)
    return [
      r.fechaRecaudo,
      r.recibo,
      r.factura,
      r.nit,
      r.cliente,
      r.local,
      r.fechaFactura,
      r.vencimiento,
      r.diasAlPago,
      c ? CARD_LABEL[c] : "Fuera del total",
      TIPO_LABEL[r.tipo],
      decena(r.fechaRecaudo),
      r.prontoPago,
      r.valorFinal,
    ]
  })
  // Footer = the card's total: depósito and mora jurídica rows stay out.
  const enTotal = rows.filter((r) => card(r) != null)
  detalle.push([
    "TOTAL RECAUDO", null, null, null, null, null, null, null, null, null, null, null,
    enTotal.reduce((s, r) => s + r.prontoPago, 0),
    enTotal.reduce((s, r) => s + r.valorFinal, 0),
  ])

  const detalleWs = buildSheet(
    [
      { header: "Fecha recaudo", width: 13 },
      { header: "Recibo", width: 22 },
      { header: "Factura", width: 16 },
      { header: "NIT", width: 18 },
      { header: "Cliente", width: 36 },
      { header: "Local", width: 8 },
      { header: "Fecha factura", width: 13 },
      { header: "Vence (+30 días)", width: 15 },
      { header: "Días factura → pago", width: 12 },
      { header: "Tarjeta", width: 16 },
      { header: "Tipo", width: 34 },
      { header: "Decena", width: 8 },
      { header: "Descuento pronto pago", width: 16, format: COP_FORMAT },
      { header: "Valor recaudado", width: 16, format: COP_FORMAT },
    ],
    detalle,
  )
  detalleWs["!autofilter"] = { ref: `A1:N${rows.length + 1}` }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, resumen, "Resumen")
  XLSX.utils.book_append_sheet(wb, detalleWs, "Recaudo")
  return xlsxResponse(wb, `recaudo_${periodo}.xlsx`)
}
