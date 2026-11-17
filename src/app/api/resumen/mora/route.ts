import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { getSessionProfile } from "@/lib/auth/session"
import { getEmpresaCkreaId } from "@/lib/empresa"
import { isValidPeriodo } from "@/lib/security/validators"
import { getMoraDelMesExport, getRecaudoExport } from "@/lib/data/resumen-export"
import { buildSheet, COP_FORMAT, xlsxResponse, type Cell } from "@/lib/xlsx-sheet"

export const dynamic = "force-dynamic"

/**
 * GET /api/resumen/mora?periodo=YYYY-MM
 * Detail behind the /resumen "Mora del mes" chip, one row per cartera document:
 *   mora del mes = recaudo mora en el mes + pendiente al cierre
 *   pendiente al cierre = sigue abierto hoy + pagado después del cierre
 */
export async function GET(req: NextRequest) {
  const profile = await getSessionProfile()
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (profile.rol === "inquilino") return NextResponse.json({ error: "Permiso denegado" }, { status: 403 })

  const periodo = req.nextUrl.searchParams.get("periodo")
  if (!isValidPeriodo(periodo)) return NextResponse.json({ error: "Período inválido" }, { status: 400 })

  const empresaId = await getEmpresaCkreaId()
  const [{ corte, documentos }, recaudo] = await Promise.all([
    getMoraDelMesExport(periodo, empresaId),
    getRecaudoExport(periodo, empresaId),
  ])
  // Late FVS cash, as in getMoraDelMesExport's recaudo CTE: rent paid late plus
  // mora-interest invoices paid after their own vencimiento (ISO dates compare
  // as strings). Jurídica late payments are already tipo mora_juridica.
  const pagosMora = recaudo.filter(
    (r) =>
      r.tipo === "mora" ||
      (r.tipo === "intereses_mora" && r.vencimiento != null && r.fechaRecaudo > r.vencimiento),
  )

  let tRecaudo = 0, tAbierto = 0, tDespues = 0
  const docRows: Cell[][] = documentos.map((d) => {
    const pendiente = d.abiertoHoy + d.pagadoDespues
    tRecaudo += d.recaudoMes
    tAbierto += d.abiertoHoy
    tDespues += d.pagadoDespues
    return [
      d.factura,
      d.nit,
      d.cliente,
      d.local,
      d.fechaFactura,
      d.vencimiento,
      d.diasVencidoCorte,
      d.recaudoMes,
      pendiente,
      d.abiertoHoy,
      d.pagadoDespues,
      d.recaudoMes + pendiente,
    ]
  })
  const tPendiente = tAbierto + tDespues
  docRows.push([
    "TOTAL", null, null, null, null, null, null,
    tRecaudo, tPendiente, tAbierto, tDespues, tRecaudo + tPendiente,
  ])

  const docsWs = buildSheet(
    [
      { header: "Factura", width: 14 },
      { header: "NIT", width: 14 },
      { header: "Cliente", width: 36 },
      { header: "Local", width: 8 },
      { header: "Fecha factura", width: 13 },
      { header: "Vence (+30 días)", width: 15 },
      { header: "Días vencido al corte", width: 12 },
      { header: "Recaudo mora en el mes", width: 18, format: COP_FORMAT },
      { header: "Pendiente al cierre", width: 18, format: COP_FORMAT },
      { header: "  · Sigue abierto hoy", width: 18, format: COP_FORMAT },
      { header: "  · Pagado después del cierre", width: 18, format: COP_FORMAT },
      { header: "Mora del mes", width: 18, format: COP_FORMAT },
    ],
    docRows,
  )
  docsWs["!autofilter"] = { ref: `A1:L${documentos.length + 1}` }

  const pagosRows: Cell[][] = pagosMora.map((r) => [
    r.fechaRecaudo, r.recibo, r.factura, r.nit, r.cliente, r.local,
    r.fechaFactura, r.vencimiento, r.diasAlPago, r.valorFinal,
  ])
  pagosRows.push(["TOTAL", null, null, null, null, null, null, null, null, pagosMora.reduce((s, r) => s + r.valorFinal, 0)])
  const pagosWs = buildSheet(
    [
      { header: "Fecha recaudo", width: 13 },
      { header: "Recibo", width: 14 },
      { header: "Factura", width: 14 },
      { header: "NIT", width: 14 },
      { header: "Cliente", width: 36 },
      { header: "Local", width: 8 },
      { header: "Fecha factura", width: 13 },
      { header: "Vence (+30 días)", width: 15 },
      { header: "Días factura → pago", width: 12 },
      { header: "Valor recaudado", width: 16, format: COP_FORMAT },
    ],
    pagosRows,
  )

  const resumen = buildSheet(
    [{ header: "Concepto", width: 44 }, { header: "Valor", width: 18, format: COP_FORMAT }],
    [
      ["Período", periodo],
      ["Corte (cierre del mes, o hoy si el mes está en curso)", corte],
      ["Recaudo mora en el mes", tRecaudo],
      ["Pendiente al cierre", tPendiente],
      ["  · Sigue abierto hoy en cartera", tAbierto],
      ["  · Pagado después del cierre", tDespues],
      ["Mora del mes", tRecaudo + tPendiente],
      [null, null],
      ["Solo arriendo FVS, vencido = factura + 30 días, sin cartera jurídica.", null],
    ],
  )

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, resumen, "Resumen")
  XLSX.utils.book_append_sheet(wb, docsWs, "Documentos")
  XLSX.utils.book_append_sheet(wb, pagosWs, "Pagos de mora del mes")
  return xlsxResponse(wb, `mora_${periodo}.xlsx`)
}
