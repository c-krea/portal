"use client"

import { useState } from "react"
import { formatCOP } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import type { MedidorAdminRow, UnitWithMeter } from "@/lib/data/medidores"
import { LecturaForm } from "@/components/medidores/lectura-form"
import { getMeterPhotoSignedUrl } from "@/app/(app)/medidores/actions"
import { X, ImageIcon, Pencil } from "lucide-react"
import { EditarLecturaDialog } from "@/components/medidores/editar-lectura-dialog"

type SortKey = "unitNumber" | "tenantName" | "kwh" | "desvPct" | "totalEnergia"
type SortDir = "asc" | "desc"

// Flag a reading more than this % away from the unit's 3-month average.
const REVISAR_PCT = 40

function ValidationBadge({
  status,
  desvPct,
  kwh,
  saltoPeriodo,
  prevPeriodo,
}: {
  status: string | null
  desvPct: number | null
  kwh: number | null
  saltoPeriodo: boolean
  prevPeriodo: string | null
}) {
  // No reading yet for this period.
  if (status === "sin_lectura")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
        Sin lectura
      </span>
    )
  // The reading before this one isn't last month's: the kWh cover more than one
  // month. Legitimate for a new tenant's first reading, a bug otherwise.
  if (saltoPeriodo)
    return (
      <span
        title={`Se comparó contra la lectura de ${prevPeriodo}, no contra el mes anterior. El consumo abarca más de un mes.`}
        className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700"
      >
        ⚠ Salto de período
      </span>
    )
  // Visual heads-up only (not mandatory): 0 kWh, or far from the unit's history.
  const rara = kwh === 0 || (desvPct != null && Math.abs(desvPct) > REVISAR_PCT)
  if (rara)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
        ⚠ Revisar
      </span>
    )
  return <span className="text-slate-300">—</span>
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

function DesvBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-slate-300">—</span>
  const abs = Math.abs(pct)
  const color =
    abs <= 10 ? "text-emerald-600" : abs <= 25 ? "text-amber-600" : "text-rose-600"
  return (
    <span className={cn("font-mono text-xs font-medium", color)}>
      {pct > 0 ? "+" : ""}{pct}%
    </span>
  )
}

export function MedidoresAdminTable({
  rows,
  units,
  periodo,
}: {
  rows: MedidorAdminRow[]
  units: UnitWithMeter[]
  periodo: string
}) {
  const [sortKey, setSortKey] = useState<SortKey>("unitNumber")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [filter, setFilter]   = useState<"all" | "registrada" | "sin_lectura">("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [showForm, setShowForm] = useState(false)
  const [loadingPhotoId, setLoadingPhotoId] = useState<string | null>(null)
  const [editRow, setEditRow] = useState<MedidorAdminRow | null>(null)

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(key); setSortDir("asc") }
  }

  // Same reset pattern as pagos-table.tsx: any filter/sort/page-size change
  // (or a new periodo's rows) drops back to page 1 so you never sit stranded
  // on an empty later page.
  const filterKey = `${filter}|${sortKey}|${sortDir}|${pageSize}|${periodo}|${rows.length}`
  const [lastFilterKey, setLastFilterKey] = useState(filterKey)
  if (lastFilterKey !== filterKey) {
    setLastFilterKey(filterKey)
    setPage(1)
  }

  const filtered = rows.filter((r) => filter === "all" || r.status === filter)

  const sorted = [...filtered].sort((a, b) => {
    const sign = sortDir === "asc" ? 1 : -1
    if (sortKey === "unitNumber")
      return a.unitNumber.localeCompare(b.unitNumber, "es") * sign
    if (sortKey === "tenantName")
      return (a.tenantName ?? "").localeCompare(b.tenantName ?? "", "es") * sign
    const av = (a[sortKey] as number | null) ?? -Infinity
    const bv = (b[sortKey] as number | null) ?? -Infinity
    return (av - bv) * sign
  })

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize)
  const rangeA = sorted.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeB = Math.min(safePage * pageSize, sorted.length)

  const COLS: { key: SortKey; label: string; align: "left" | "right"; hide?: string }[] = [
    { key: "unitNumber",   label: "Local",        align: "left" },
    { key: "tenantName",   label: "Arrendatario", align: "left",  hide: "hidden sm:table-cell" },
    { key: "kwh",          label: "kWh",          align: "right" },
    { key: "desvPct",      label: "vs Histórico",  align: "right", hide: "hidden md:table-cell" },
    { key: "totalEnergia", label: "Total",         align: "right", hide: "hidden sm:table-cell" },
  ]

  return (
    <div>
      {/* Controls row */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1 text-xs">
          {(["all", "registrada", "sin_lectura"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-3 py-1 font-medium transition-colors",
                filter === f
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              {f === "all" ? "Todos" : f === "registrada" ? "Registradas" : "Sin lectura"}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          {showForm ? <X className="h-3.5 w-3.5" /> : "+ "}
          Registrar lectura
        </button>
      </div>

      {/* Manual entry form */}
      {showForm && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Registrar Lectura Manual</h2>
          <LecturaForm units={units} periodo={periodo} />
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {COLS.map(({ key, label, align, hide }) => {
                const active = sortKey === key
                const ind = active ? (sortDir === "asc" ? " ↑" : " ↓") : ""
                return (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className={cn(
                      "cursor-pointer select-none px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 hover:text-slate-800",
                      align === "right" ? "text-right" : "text-left",
                      active && "text-slate-800",
                      hide,
                    )}
                  >
                    {label}{ind}
                  </th>
                )
              })}
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Alerta
              </th>
              <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Foto
              </th>
              <th className="px-4 py-3" aria-label="Acciones" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginated.map((row) => (
              <tr key={row.unitId} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-sm font-medium text-slate-700">
                  {row.unitNumber}
                </td>
                <td className="hidden sm:table-cell px-4 py-3 text-slate-700">
                  {row.tenantName ?? <span className="text-slate-300">—</span>}
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-900">
                  {row.kwh != null ? row.kwh.toLocaleString("es-CO") : <span className="text-slate-300">—</span>}
                </td>
                <td className="hidden md:table-cell px-4 py-3 text-right">
                  <DesvBadge pct={row.desvPct} />
                  {row.promedio3m != null && (
                    <span className="ml-1 text-[10px] text-slate-400">
                      (p3m: {row.promedio3m.toLocaleString("es-CO")})
                    </span>
                  )}
                </td>
                <td className="hidden sm:table-cell px-4 py-3 text-right font-medium text-slate-900">
                  {row.totalEnergia != null ? formatCOP(row.totalEnergia) : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-4 py-3">
                  <ValidationBadge
                    status={row.status}
                    desvPct={row.desvPct}
                    kwh={row.kwh}
                    saltoPeriodo={row.saltoPeriodo}
                    prevPeriodo={row.prevPeriodo}
                  />
                </td>
                <td className="hidden sm:table-cell px-4 py-3">
                  {row.fotoUrl ? (
                    <button
                      disabled={loadingPhotoId === row.unitId}
                      onClick={async () => {
                        const win = window.open("", "_blank")
                        setLoadingPhotoId(row.unitId)
                        try {
                          const url = await getMeterPhotoSignedUrl(row.fotoUrl!)
                          if (url && win) win.location.href = url
                          else { win?.close(); alert("No se pudo abrir la foto. Intente de nuevo.") }
                        } finally {
                          setLoadingPhotoId(null)
                        }
                      }}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      {loadingPhotoId === row.unitId ? "Cargando…" : "Ver"}
                    </button>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {row.readingId && (
                    <button
                      onClick={() => setEditRow(row)}
                      title="Corregir lectura"
                      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Editar</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
          <p className="text-xs text-slate-400">
            Mostrando {rangeA}–{rangeB} de {sorted.length} unidades · {periodo}
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
      </div>

      {editRow && (
        <EditarLecturaDialog key={editRow.readingId} row={editRow} periodo={periodo} onClose={() => setEditRow(null)} />
      )}
    </div>
  )
}
