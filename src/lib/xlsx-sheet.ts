import * as XLSX from "xlsx"

export type Cell = string | number | null

export type SheetColumn = {
  header: string
  width?: number
  /** Excel number format for numeric cells, e.g. "#,##0" for COP. */
  format?: string
}

/** Builds a worksheet from columns + rows, keeping numbers numeric (summable in Excel). */
export function buildSheet(columns: SheetColumn[], rows: Cell[][]): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet([columns.map((c) => c.header), ...rows.map((r) => r.map((v) => v ?? ""))])
  ws["!cols"] = columns.map((c) => ({ wch: c.width ?? Math.max(10, c.header.length + 2) }))
  columns.forEach((c, ci) => {
    if (!c.format) return
    for (let ri = 1; ri <= rows.length; ri++) {
      const cell = ws[XLSX.utils.encode_cell({ r: ri, c: ci })]
      if (cell && cell.t === "n") cell.z = c.format
    }
  })
  return ws
}

export const COP_FORMAT = "$ #,##0"

export function xlsxResponse(wb: XLSX.WorkBook, filename: string): Response {
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}
