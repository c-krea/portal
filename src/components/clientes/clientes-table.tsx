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
import { useState, useMemo } from "react"
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronRight } from "lucide-react"
import Link from "next/link"
import { formatCOP } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import type { ClienteRow } from "@/lib/data/clientes"

const STATUS_CONFIG = {
  al_dia: { dot: "bg-emerald-500", label: "Al Día" },
  en_mora: { dot: "bg-rose-500", label: "En Mora" },
  critico: { dot: "bg-rose-700", label: "Crítico" },
  inactivo: { dot: "bg-slate-300", label: "Inactivo" },
} as const

type Tab = "todos" | "activos" | "en_mora" | "criticos" | "inactivos"

const TABS: { id: Tab; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "activos", label: "Activos" },
  { id: "en_mora", label: "En Mora" },
  { id: "criticos", label: "Críticos" },
  { id: "inactivos", label: "Inactivos" },
]

function filterByTab(rows: ClienteRow[], tab: Tab): ClienteRow[] {
  switch (tab) {
    case "activos":
      return rows.filter((r) => r.status === "al_dia" || r.status === "en_mora" || r.status === "critico")
    case "en_mora":
      return rows.filter((r) => r.status === "en_mora" || r.status === "critico")
    case "criticos":
      return rows.filter((r) => r.status === "critico")
    case "inactivos":
      return rows.filter((r) => r.status === "inactivo")
    default:
      return rows
  }
}

const columns: ColumnDef<ClienteRow>[] = [
  {
    accessorKey: "unitNumber",
    header: "Local",
    size: 90,
    cell: ({ getValue }) => (
      <span className="font-medium text-slate-700">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "cliente",
    header: "Cliente",
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-slate-900">{row.original.cliente ?? <span className="italic text-slate-400">Vacante</span>}</p>
        {row.original.nit && (
          <p className="text-xs text-slate-400">{row.original.nit}</p>
        )}
      </div>
    ),
  },
  {
    accessorKey: "entrada",
    header: "Entrada",
    size: 80,
    cell: ({ getValue }) => (
      <span className="text-slate-600">{getValue<string>()}</span>
    ),
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
          <span className="text-sm text-slate-700">{label}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "canonBase",
    header: "Canon Mensual",
    size: 130,
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
      row.original.tenantId ? (
        <Link
          href={`/clientes/${row.original.tenantId}`}
          className="flex items-center justify-center rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : null,
  },
]

export function ClientesTable({ data }: { data: ClienteRow[] }) {
  const [tab, setTab] = useState<Tab>("todos")
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  const tabCounts = useMemo(
    () => ({
      todos: data.length,
      activos: data.filter((r) => r.status !== "inactivo").length,
      en_mora: data.filter((r) => r.status === "en_mora" || r.status === "critico").length,
      criticos: data.filter((r) => r.status === "critico").length,
      inactivos: data.filter((r) => r.status === "inactivo").length,
    }),
    [data]
  )

  const filtered = useMemo(() => filterByTab(data, tab), [data, tab])

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
      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar cliente, local o NIT..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-slate-200">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              tab === id
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-xs",
                tab === id ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
              )}
            >
              {tabCounts[id]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
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
                      header.column.getCanSort() && "cursor-pointer select-none hover:text-slate-700"
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
                  key={row.id}
                  className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer"
                  onClick={() =>
                    row.original.tenantId &&
                    (window.location.href = `/clientes/${row.original.tenantId}`)
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
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
        {table.getFilteredRowModel().rows.length} de {filtered.length} registros
      </p>
    </div>
  )
}
