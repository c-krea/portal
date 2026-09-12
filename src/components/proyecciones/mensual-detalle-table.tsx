"use client"

import { useMemo, useState } from "react"
import { formatCOP } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import type { MensualDetalle } from "@/lib/data/proyecciones"

type SortKey = keyof Pick<
  MensualDetalle,
  "unidades" | "cliente" | "tipoPersona" | "facturasCount" | "baseNeta" | "iva" | "retenciones" | "valorTotal"
>

type SortDir = "asc" | "desc"

const COLS: { key: SortKey; label: string; align: "left" | "right" | "center"; hide?: string }[] = [
  { key: "unidades",      label: "Local(es)",     align: "left" },
  { key: "cliente",       label: "Arrendatario",  align: "left" },
  { key: "tipoPersona",   label: "Tipo",          align: "center", hide: "hidden sm:table-cell" },
  { key: "facturasCount", label: "# Facturas",    align: "right",  hide: "hidden md:table-cell" },
  { key: "baseNeta",      label: "Base",          align: "right",  hide: "hidden md:table-cell" },
  { key: "iva",           label: "IVA",           align: "right",  hide: "hidden lg:table-cell" },
  { key: "retenciones",   label: "Retenciones",   align: "right",  hide: "hidden lg:table-cell" },
  { key: "valorTotal",    label: "Total",         align: "right" },
]

function compare(a: MensualDetalle, b: MensualDetalle, key: SortKey, dir: SortDir): number {
  const av = a[key]
  const bv = b[key]
  const sign = dir === "asc" ? 1 : -1
  if (typeof av === "number" && typeof bv === "number") return (av - bv) * sign
  return String(av).localeCompare(String(bv)) * sign
}

// Windowed page numbers: 1 … (c-1) c (c+1) … N with a 2-page edge.
function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = [...new Set(
    [1, 2, current - 1, current, current + 1, total - 1, total].filter((n) => n >= 1 && n <= total),
  )].sort((a, b) => a - b)
  const out: (number | "…")[] = []
  pages.forEach((n, i) => {
    if (i > 0 && n - pages[i - 1] > 1) out.push("…")
    out.push(n)
  })
  return out
}

export function MensualDetalleTable({ data }: { data: MensualDetalle[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("unidades")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  // Same reset pattern as pagos-table.tsx: any sort/page-size change (or new
  // rows) drops back to page 1 so you never sit stranded on an empty page.
  const filterKey = `${sortKey}|${sortDir}|${pageSize}|${data.length}`
  const [lastFilterKey, setLastFilterKey] = useState(filterKey)
  if (lastFilterKey !== filterKey) {
    setLastFilterKey(filterKey)
    setPage(1)
  }

  const sorted = useMemo(
    () => [...data].sort((a, b) => compare(a, b, sortKey, sortDir)),
    [data, sortKey, sortDir],
  )
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize)
  const rangeA = sorted.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeB = Math.min(safePage * pageSize, sorted.length)

  return (
    <>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            {COLS.map(({ key, label, align, hide }) => {
              const active = sortKey === key
              const indicator = active ? (sortDir === "asc" ? " ↑" : " ↓") : ""
              return (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className={`cursor-pointer select-none px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 hover:text-slate-800 ${
                    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
                  }${active ? " text-slate-800" : ""}${hide ? ` ${hide}` : ""}`}
                >
                  {label}{indicator}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {paginated.map((row) => (
            <tr key={row.inquilinoId} className="hover:bg-slate-50">
              <td className="px-4 py-2.5 font-mono text-xs font-semibold text-slate-800">{row.unidades}</td>
              <td className="px-4 py-2.5 text-sm text-slate-700">{row.cliente}</td>
              <td className="hidden sm:table-cell px-4 py-2.5 text-center">
                <span
                  title={row.tipoPersona === "PJ" ? "Persona Jurídica · retefuente 3.5%" : "Persona Natural · sin retefuente"}
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    row.tipoPersona === "PJ"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {row.tipoPersona}
                </span>
              </td>
              <td className="hidden md:table-cell px-4 py-2.5 text-right text-slate-600">{row.facturasCount}</td>
              <td className="hidden md:table-cell px-4 py-2.5 text-right font-mono text-slate-700">{formatCOP(row.baseNeta)}</td>
              <td className="hidden lg:table-cell px-4 py-2.5 text-right font-mono text-slate-600">{formatCOP(row.iva)}</td>
              <td className="hidden lg:table-cell px-4 py-2.5 text-right font-mono text-rose-500">
                {row.retenciones > 0 ? `− ${formatCOP(row.retenciones)}` : <span className="text-slate-300">—</span>}
              </td>
              <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-900">{formatCOP(row.valorTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
      <p className="text-xs text-slate-400">
        Mostrando {rangeA}–{rangeB} de {sorted.length}
      </p>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs text-slate-400">
          Filas
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-700 focus:border-slate-400 focus:outline-none"
          >
            {[25, 50, 100].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, safePage - 1))}
              disabled={safePage === 1}
              aria-label="Página anterior"
              className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              ‹
            </button>
            {pageWindow(safePage, totalPages).map((n, i) =>
              n === "…" ? (
                <span key={`gap-${i}`} className="px-1 text-xs text-slate-400">…</span>
              ) : (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                    n === safePage
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50",
                  )}
                >
                  {n}
                </button>
              ),
            )}
            <button
              onClick={() => setPage(Math.min(totalPages, safePage + 1))}
              disabled={safePage === totalPages}
              aria-label="Página siguiente"
              className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  )
}
