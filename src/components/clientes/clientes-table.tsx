"use client"

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { useState, useMemo, useEffect, useRef } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronRight, X } from "lucide-react"
import { formatCOP } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import { EstadoCuentaButton } from "@/components/clientes/estado-cuenta-button"
import type { ClienteRow } from "@/lib/data/clientes"

type StatusKey = ClienteRow["status"]
type Panel = "estado" | "entrada" | null

// Same ring-pill language as PagosTable's ESTADO_META, mapped onto the 4
// locales statuses. Colors keep the existing dot semantics (al_dia emerald,
// en_mora rose, critico stronger rose, inactivo slate) — only the shape
// changes from dot+label to pill. inactivo renders as "Vacante" to match the
// Estado filter option.
const ESTADO_META: Record<StatusKey, { label: string; pill: string; checkbox: string }> = {
  al_dia:   { label: "Al día",  pill: "bg-emerald-50 text-emerald-700 ring-emerald-200", checkbox: "accent-emerald-600" },
  en_mora:  { label: "En mora", pill: "bg-rose-50 text-rose-700 ring-rose-200",          checkbox: "accent-rose-600" },
  critico:  { label: "Crítico", pill: "bg-rose-100 text-rose-800 ring-rose-300",         checkbox: "accent-rose-700" },
  inactivo: { label: "Vacante", pill: "bg-slate-100 text-slate-600 ring-slate-200",      checkbox: "accent-slate-500" },
}

const ENTRADAS = [
  { value: "1",      label: "Entrada 1" },
  { value: "2",      label: "Entrada 2" },
  { value: "3",      label: "Entrada 3" },
  { value: "4",      label: "Entrada 4" },
  { value: "5",      label: "Entrada 5" },
  { value: "ZONA 8", label: "Zona 8"    },
]

// Position of an entrada in ENTRADAS; unknown or missing entradas go last.
function entradaRank(entrada: string | undefined): number {
  const i = ENTRADAS.findIndex((e) => e.value === entrada)
  return i === -1 ? ENTRADAS.length : i
}

// "412" < "416" < "2-401" < "2-416": plain locales first, then the "2-"
// series; within each, by number and then letter suffix (406A < 406B).
function unidadKey(u: string): [number, number, string] {
  const m = u.match(/^(?:(\d+)-)?(\d+)(.*)$/)
  if (!m) return [Number.MAX_SAFE_INTEGER, 0, u]
  return [m[1] ? Number(m[1]) : 1, Number(m[2]), m[3]]
}

function compareUnidad(a: string, b: string): number {
  const [sa, na, xa] = unidadKey(a)
  const [sb, nb, xb] = unidadKey(b)
  return sa - sb || na - nb || xa.localeCompare(xb)
}

// Windowed page numbers: 1 … (c-1) c (c+1) … N with a 2-page edge.
// Copied from src/components/pagos/pagos-table.tsx.
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

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    className?: string
  }
}

const columns: ColumnDef<ClienteRow>[] = [
  {
    accessorKey: "cliente",
    header: "Cliente",
    cell: ({ row }) => (
      <div>
        {row.original.cliente ? (
          <div className="flex items-center gap-1.5">
            <p className="font-medium text-slate-900">{row.original.cliente}</p>
            {row.original.tenantId && <EstadoCuentaButton tenantId={row.original.tenantId} />}
          </div>
        ) : (
          <p className="italic text-slate-400">Vacante</p>
        )}
        {row.original.nit && (
          <p className="text-xs text-slate-400">{row.original.nit}</p>
        )}
      </div>
    ),
  },
  {
    accessorKey: "unitNumbers",
    header: "Locales",
    meta: { className: "hidden sm:table-cell" },
    // Entrada first, then local. Sorting by the local alone put the "2-4xx"
    // series (Entrada 4) before every other entrada.
    sortingFn: (a, b) => {
      const ea = entradaRank(a.original.entradas[0])
      const eb = entradaRank(b.original.entradas[0])
      if (ea !== eb) return ea - eb
      return compareUnidad(a.original.unitNumbers[0] ?? "", b.original.unitNumbers[0] ?? "")
    },
    cell: ({ row }) => {
      const units = row.original.unitNumbers
      const entradas = row.original.entradas
      if (!units.length) return <span className="text-slate-400">—</span>
      return (
        <div className="flex flex-wrap gap-1">
          {units.map((u, i) => (
            <span
              key={u}
              className="flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600"
            >
              {entradas[i] && (
                <span className="text-slate-400">
                  E{entradas[i] === "ZONA 8" ? "8" : entradas[i]}·
                </span>
              )}
              {u}
            </span>
          ))}
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    size: 110,
    cell: ({ getValue }) => {
      const s = getValue<ClienteRow["status"]>()
      const meta = ESTADO_META[s]
      return (
        <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1", meta.pill)}>
          {meta.label}
        </span>
      )
    },
  },
  {
    accessorKey: "canonTotal",
    header: "Canon Mensual",
    size: 130,
    meta: { className: "hidden md:table-cell" },
    cell: ({ getValue }) => {
      const v = getValue<number>()
      return v > 0 ? (
        <span className="font-medium text-slate-900">{formatCOP(v)}</span>
      ) : (
        <span className="text-slate-400">—</span>
      )
    },
  },
  {
    accessorKey: "saldoVencido",
    header: "Saldo Pendiente",
    size: 130,
    cell: ({ getValue }) => {
      const v = getValue<number>()
      return v > 0 ? (
        <span className="font-medium text-rose-600">{formatCOP(v)}</span>
      ) : (
        <span className="text-slate-400">—</span>
      )
    },
  },
  {
    id: "acciones",
    header: "",
    size: 50,
    cell: ({ row }) =>
      row.original.isVacant ? null : (
        <div className="flex items-center justify-center rounded-md p-1 text-slate-400">
          <ChevronRight className="h-4 w-4" />
        </div>
      ),
  },
]

export function ClientesTable({
  data,
  vacantUnits,
  activeEntrada,
}: {
  data: ClienteRow[]
  vacantUnits: ClienteRow[]
  activeEntrada?: string
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Empty = no filter applied (shows everything). Same rule as PagosTable.
  const [estados, setEstados] = useState<StatusKey[]>([])
  const [sorting, setSorting] = useState<SortingState>([{ id: "unitNumbers", desc: false }])
  const [globalFilter, setGlobalFilter] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [openPanel, setOpenPanel] = useState<Panel>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)

  // Panels are floating (absolute): opening one never moves the table.
  // Copied from PagosTable.
  useEffect(() => {
    if (!openPanel) return
    const onDown = (e: PointerEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) setOpenPanel(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenPanel(null)
    }
    document.addEventListener("pointerdown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [openPanel])

  // Narrowed page resets when any filter or the underlying rows change.
  useEffect(() => {
    setPage(1)
  }, [estados, globalFilter, pageSize, activeEntrada, data, vacantUnits])

  function togglePanel(p: Exclude<Panel, null>) {
    setOpenPanel((prev) => (prev === p ? null : p))
  }

  function toggleEstado(s: StatusKey) {
    setEstados((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  }

  // Entrada stays a server round-trip via URL param (narrows KPIs + rows) —
  // only the trigger is restyled to the floating-panel look. Single-select,
  // closes on pick.
  function setEntrada(next: string | undefined) {
    setOpenPanel(null)
    const params = new URLSearchParams(searchParams.toString())
    if (!next) params.delete("entrada")
    else params.set("entrada", next)
    params.delete("tab")
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  function clearAll() {
    setEstados([])
    setGlobalFilter("")
    router.push(pathname, { scroll: false })
  }

  const allRows = useMemo(() => [...data, ...vacantUnits], [data, vacantUnits])

  const estadoFiltered = useMemo(
    () => (estados.length === 0 ? allRows : allRows.filter((r) => estados.includes(r.status))),
    [allRows, estados],
  )

  const table = useReactTable({
    data: estadoFiltered,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const sortedRows = table.getRowModel().rows
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = sortedRows.slice((safePage - 1) * pageSize, safePage * pageSize)
  const rangeA = sortedRows.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeB = Math.min(safePage * pageSize, sortedRows.length)

  const hasActiveFilters = estados.length > 0 || !!activeEntrada || globalFilter !== ""
  const entradaLabel = activeEntrada
    ? (ENTRADAS.find((e) => e.value === activeEntrada)?.label ?? `Entrada ${activeEntrada}`)
    : "Entrada"

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        {/* Floating filter panels live inside `relative` wrappers below, so the
            toolbar keeps its height whether a panel is open or not. Same
            pattern as PagosTable: only one panel open at a time,
            outside-click / Escape to close. */}
        <div ref={toolbarRef} className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Buscar cliente o NIT..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-10 w-full max-w-xs rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-400 focus:outline-none"
          />
          <div className="relative">
            <button
              onClick={() => togglePanel("estado")}
              className="flex h-10 min-w-[120px] items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 hover:border-slate-300"
            >
              Estado{estados.length > 0 ? `: ${estados.length}` : ""}
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
            {openPanel === "estado" && (
              <div className="absolute left-0 top-full z-20 mt-1 w-48 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                {(Object.keys(ESTADO_META) as StatusKey[]).map((s) => (
                  <label
                    key={s}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    <input
                      type="checkbox"
                      checked={estados.includes(s)}
                      onChange={() => toggleEstado(s)}
                      className={cn("h-4 w-4 rounded", ESTADO_META[s].checkbox)}
                    />
                    {ESTADO_META[s].label}
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => togglePanel("entrada")}
              className="flex h-10 min-w-[140px] items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 hover:border-slate-300"
            >
              {entradaLabel}
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
            {openPanel === "entrada" && (
              <div className="absolute left-0 top-full z-20 mt-1 w-44 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                <button
                  onClick={() => setEntrada(undefined)}
                  className={cn(
                    "w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-100",
                    !activeEntrada ? "font-semibold text-slate-900" : "text-slate-600",
                  )}
                >
                  Todas
                </button>
                {ENTRADAS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setEntrada(activeEntrada === value ? undefined : value)}
                    className={cn(
                      "w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-100",
                      activeEntrada === value ? "font-semibold text-slate-900" : "text-slate-600",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="flex shrink-0 items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
            >
              <X className="h-3 w-3" />
              Limpiar
            </button>
          )}
          <span className="ml-auto whitespace-nowrap text-sm text-slate-500">
            {sortedRows.length} de {allRows.length} locales
          </span>
        </div>
      </div>

      {sortedRows.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-sm text-slate-400">
            {allRows.length === 0 ? "No hay locales registrados aún" : "Sin resultados para este filtro"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-slate-100">
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      style={{ width: header.column.columnDef.size }}
                      className={cn(
                        "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500",
                        header.column.getCanSort() && "cursor-pointer select-none hover:text-slate-700",
                        header.column.columnDef.meta?.className,
                      )}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() &&
                          (header.column.getIsSorted() === "asc" ? (
                            <ArrowUp className="h-3 w-3 text-slate-500" />
                          ) : header.column.getIsSorted() === "desc" ? (
                            <ArrowDown className="h-3 w-3 text-slate-500" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-slate-300" />
                          ))}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {paginated.map((row) => (
                <tr
                  key={row.original.tenantId ?? `vacant-${row.original.unitNumbers[0]}`}
                  className={`border-b border-slate-50 hover:bg-slate-50 ${row.original.isVacant ? "" : "cursor-pointer"}`}
                  onClick={() => {
                    if (!row.original.isVacant && row.original.tenantId)
                      router.push(`/locales/${row.original.tenantId}`)
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={cn("px-4 py-3", cell.column.columnDef.meta?.className)}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
        <p className="text-xs text-slate-400">
          Mostrando {rangeA}–{rangeB} de {sortedRows.length}
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
  )
}
