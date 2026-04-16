import { db } from "@/lib/db/client"
import { sql } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /facturas/export?periodo=YYYY-MM
 *
 * Exports invoices in Siesa "Documentos" sheet format (CSV).
 * Columns match ckrea.xlsx exactly:
 * documento, periodo, id_canal, canal, id_co, co, doc, cliente,
 * tipo_cliente, tipo, auxiliar, ventas, impuesto, retenciones
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const periodo = searchParams.get("periodo")

  const rows = await db.execute(sql`
    SELECT
      COALESCE(i.siesa_documento, '001-FVS-' || UPPER(SUBSTRING(i.id::text, 1, 8))) AS documento,
      REPLACE(i.periodo, '-', '')                                                     AS periodo_siesa,
      t.nit                                                                           AS doc,
      COALESCE(t.nombre_corto, t.razon_social)                                       AS cliente,
      COALESCE(i.subtotal_canon, 0)::numeric - COALESCE(i.subtotal_descuentos, 0)::numeric AS ventas,
      COALESCE(i.iva, 0)::numeric                                                    AS impuesto,
      COALESCE(i.retenciones, 0)::numeric                                            AS retenciones
    FROM invoices i
    JOIN tenants t ON i.tenant_id = t.id
    WHERE i.status IN ('emitida', 'pagada', 'parcial', 'vencida')
      ${periodo ? sql`AND i.periodo = ${periodo}` : sql``}
    ORDER BY i.periodo DESC, t.nit
  `)

  // CSV header — exact Documentos sheet column order
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
    const ventas = Number(r.ventas).toFixed(2).replace(".", ",")
    const impuesto = Number(r.impuesto).toFixed(2).replace(".", ",")
    const retenciones = Number(r.retenciones).toFixed(2).replace(".", ",")

    lines.push(
      [
        escape(String(r.documento)),
        escape(String(r.periodo_siesa)),
        "R08",                         // id_canal — C-Krea channel code
        "C-KREA",                      // canal
        "044",                         // id_co — C-Krea company code
        "Central Creativa C-KREA",     // co
        escape(String(r.doc).trim()),  // NIT
        escape(String(r.cliente)),
        "1003",                        // tipo_cliente
        "Facturas",                    // tipo
        "42201006",                    // auxiliar — Siesa rent account
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
