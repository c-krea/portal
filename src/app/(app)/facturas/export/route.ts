import { execute } from "@/lib/db/executor"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /facturas/export?periodo=YYYY-MM
 *
 * v2: exports vista_facturas in Siesa "Documentos" sheet format (CSV).
 * This is round-trip — facturas already come from Siesa, but the download lets
 * users re-upload after manual edits. Hardcoded id_canal/canal/id_co/co/auxiliar
 * match the C-Krea Siesa codes.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const periodo = searchParams.get("periodo")
  const periodoInt = periodo ? Number(periodo.replace("-", "")) : null

  const rows = await execute(`
    SELECT
      v.doc_id                                                                             AS documento,
      LPAD(v.periodo::text, 6, '0')                                                        AS periodo_siesa,
      v.nit_inquilino                                                                      AS doc,
      v.razon_social                                                                       AS cliente,
      (COALESCE(v.base_neta, 0) - COALESCE(v.retenciones, 0))::numeric                     AS ventas,
      COALESCE(v.iva, 0)::numeric                                                          AS impuesto,
      COALESCE(v.retenciones, 0)::numeric                                                  AS retenciones
    FROM v2.vista_facturas v
    WHERE v.is_factura = true
      ${periodoInt ? `AND v.periodo = ${periodoInt}` : ``}
    ORDER BY v.periodo DESC, v.nit_inquilino
  `)

  const header = [
    "documento", "periodo", "id_canal", "canal", "id_co", "co",
    "doc", "cliente", "tipo_cliente", "tipo", "auxiliar",
    "ventas", "impuesto", "retenciones",
  ]

  const escape = (v: string | number) => {
    const s = String(v).replace(/"/g, '""')
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s
  }

  const lines: string[] = [header.join(",")]

  for (const r of rows as Array<Record<string, unknown>>) {
    const ventas      = Number(r.ventas).toFixed(2).replace(".", ",")
    const impuesto    = Number(r.impuesto).toFixed(2).replace(".", ",")
    const retenciones = Number(r.retenciones).toFixed(2).replace(".", ",")

    lines.push(
      [
        escape(String(r.documento)),
        escape(String(r.periodo_siesa)),
        "R08",
        "C-KREA",
        "044",
        "Central Creativa C-KREA",
        escape(String(r.doc).trim()),
        escape(String(r.cliente)),
        "1003",
        "Facturas",
        "42201006",
        ventas,
        impuesto,
        retenciones,
      ].join(","),
    )
  }

  const csv = lines.join("\r\n")
  const filename = periodo
    ? `siesa_documentos_${periodo}.csv`
    : `siesa_documentos_all.csv`

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
