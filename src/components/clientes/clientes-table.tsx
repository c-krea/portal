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
import { useState, useMemo, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronRight, SlidersHorizontal, X } from "lucide-react"
import { formatCOP } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import type { ClienteRow } from "@/lib/data/clientes"

const STATUS_CONFIG = {
  al_dia:   { dot: "bg-emerald-500", label: "Al Día" },
  en_mora:  { dot: "bg-rose-500",    label: "En Mora" },
  critico:  { dot: "bg-rose-700",    label: "Crítico" },
  inactivo: { dot: "bg-slate-300",   label: "Inactivo" },
} as const

const ENTRADAS = [
  { value: "1",      label: "Entrada 1" },
  { value: "2",      label: "Entrada 2" },
  { value: "3",      label: "Entrada 3" },
  { value: "4",      label: "Entrada 4" },
  { value: "5",      label: "Entrada 5" },
  { value: "ZONA 8", label: "Zona 8"    },
]

type Tab = "todos" | "al_dia" | "en_mora" | "criticos" | "inactivos"

const ESTADO_OPTIONS: { id: Tab; label: string }[] = [
  { id: "todos",     label: "Todos" },
  { id: "al_dia",    label: "Al Día" },
  { id: "en_mora",   label: "En Mora" },
  { id: "criticos",  label: "Críticos" },
  { id: "inactivos", label: "Vacantes" },
]

const TAB_DEFAULT_SORT: Record<Tab, SortingState> = {
  todos:     [{ id: "unitNumbers",  desc: false }],
  al_dia:    [{ id: "canonTotal",   desc: true }],
  en_mora:   [{ id: "saldoVencido", desc: true }],
  criticos:  [{ id: "saldoVencido", desc: true }],
  inactivos: [{ id: "unitNumbers",  desc: false }],
}

function filterByTab(rows: ClienteRow[], tab: Tab, vacantUnits: ClienteRow[]): ClienteRow[] {
  switch (tab) {
    case "al_dia":    return rows.filter((r) => r.status === "al_dia")
    case "en_mora":   return rows.filter((r) => r.status === "en_mora")
    case "criticos":  return rows.filter((r) => r.status === "critico")
    case "inactivos": return vacantUnits
    default:          return rows
  }
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
          <p className="font-medium text-slate-900">{row.original.cliente}</p>
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
    sortingFn: (a, b) => {
      const av = a.original.unitNumbers[0] ?? ""
      const bv = b.original.unitNumbers[0] ?? ""
      const an = Number(av), bn = Number(bv)
      if (!isNaN(an) && !isNaN(bn)) return an - bn
      return av.localeCompare(bv)
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
      const { dot, label } = STATUS_CONFIG[s]
      return (
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full shrink-0", dot)} />
          <span className="text-slate-700">{label}</span>
        </div>
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

  const rawTab = searchParams.get("tab")
  const tab: Tab = (["todos","al_dia","en_mora","criticos","inactivos"].includes(rawTab ?? "") ? rawTab : "todos") as Tab

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sorting, setSorting] = useState<SortingState>(TAB_DEFAULT_SORT[tab])
  const [globalFilter, setGlobalFilter] = useState("")

  useEffect(() => { setSorting(TAB_DEFAULT_SORT[tab]) }, [tab])

  const activeFilterCount = (tab !== "todos" ? 1 : 0) + (activeEntrada ? 1 : 0)

  function setTab(next: Tab) {
    const params = new URLSearchParams(searchParams.toString())
    if (next === "todos") params.delete("tab")
    else params.set("tab", next)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function setEntrada(next: string | undefined) {
    const params = new URLSearchParams(searchParams.toString())
    if (!next) params.delete("entrada")
    else params.set("entrada", next)
    params.delete("tab")
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function clearAll() {
    router.push(pathname, { scroll: false })
    setGlobalFilter("")
  }

  const tabCounts = useMemo(
    () => ({
      todos:     data.length,
      al_dia:    data.filter((r) => r.status === "al_dia").length,
      en_mora:   data.filter((r) => r.status === "en_mora").length,
      criticos:  data.filter((r) => r.status === "critico").length,
      inactivos: vacantUnits.length,
    }),
    [data, vacantUnits]
  )

  const filtered = useMemo(() => filterByTab(data, tab, vacantUnits), [data, tab, vacantUnits])

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-3 flex items-center gap-2">
        <input
          type="text"
          placeholder="Buscar cliente o NIT..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        <button
          onClick={() => setFiltersOpen((o) => !o)}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium shadow-sm transition-colors",
            filtersOpen || activeFilterCount > 0
              ? "border-blue-500 bg-blue-50 text-blue-700"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtros
          {activeFilterCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        {activeFilterCount > 0 && (
          <button
            onClick={clearAll}
            className="flex shrink-0 items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
          >
            <X className="h-3 w-3" />
            Limpiar
          </button>
        )}
      </div>

      {/* Filter panel */}
      {filtersOpen && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">

          {/* Estado */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Estado</p>
            <div className="flex flex-wrap gap-2">
              {ESTADO_OPTIONS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    tab === id
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {label}
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px]",
                    tab === id ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                  )}>
                    {tabCounts[id]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Entrada */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Entrada</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setEntrada(undefined)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  !activeEntrada
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                )}
              >
                Todas
              </button>
              {ENTRADAS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setEntrada(activeEntrada === value ? undefined : value)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    activeEntrada === value
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {tab !== "todos" && (
            <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
              {ESTADO_OPTIONS.find((o) => o.id === tab)?.label}
              <button onClick={() => setTab("todos")} className="ml-0.5 hover:text-blue-900">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {activeEntrada && (
            <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
              {ENTRADAS.find((e) => e.value === activeEntrada)?.label}
              <button onClick={() => setEntrada(undefined)} className="ml-0.5 hover:text-blue-900">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-xs">
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
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-slate-400">
                  No hay clientes en esta categoría
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
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
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-slate-400">
        {table.getFilteredRowModel().rows.length} de {filtered.length} clientes
      </p>
    </div>
  )
}
