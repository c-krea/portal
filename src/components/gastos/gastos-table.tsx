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
import { useState } from "react"
import { ChevronRight, X } from "lucide-react"
import { CAT_COLORS } from "./cat-colors"

function fmtPeriodo(p: string) {
  const [year, month] = p.split("-")
  return `${month}/${year?.slice(2)}`
}

function fmtDelta(v: number): string {
  const abs = Math.abs(v)
  const sign = v >= 0 ? "+" : "-"
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000)     return `${sign}$${Math.round(abs / 1_000)}k`
  return `${sign}$${Math.round(abs)}`
}

import { formatCOP } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import type { GastoRow, GastoDetail } from "@/lib/data/gastos"

const CATEGORY_LABELS: Record<string, string> = {
  servicios_publicos: "Servicios Públicos",
  aseo_cafeteria:     "Aseo y Cafetería",
  vigilancia:         "Vigilancia",
  nomina:             "Nómina",
  publicidad:         "Publicidad",
  reparaciones:       "Reparaciones",
  impuestos:          "Impuestos",
  otros:              "Otros",
}

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    className?: string
  }
}

function DetailPanel({
  row,
  onClose,
}: {
  row: GastoRow
  onClose: () => void
}) {
  const total = row.details.reduce((s, d) => s + d.amount, 0)

  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {CATEGORY_LABELS[row.category] ?? row.category}
          </p>
          <p className="text-lg font-bold text-slate-900 tabular-nums">
            {formatCOP(row.totalAmount)}
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          aria-label="Cerrar detalle"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {row.details.map((d: GastoDetail) => {
          const pct = total > 0 ? Math.round((d.amount / total) * 100) : 0
          return (
            <div key={d.name} className="flex items-center gap-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm text-slate-700">{d.name}</p>
                <div className="mt-1 h-1 w-full rounded-full bg-slate-200">
                  <div
                    className="h-1 rounded-full bg-slate-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-sm font-medium text-slate-900">
                  {formatCOP(d.amount)}
                </p>
                <p className="text-xs text-slate-400">{pct}%</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function GastosTable({ data, embedded = false }: { data: GastoRow[]; embedded?: boolean }) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "totalAmount", desc: true },
  ])
  const [globalFilter, setGlobalFilter] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedRow = data.find((r) => r.id === selectedId) ?? null
  const grandTotal = data.reduce((s, r) => s + r.totalAmount, 0)

  const columns: ColumnDef<GastoRow>[] = [
    {
      accessorKey: "periodo",
      header: "Período",
      size: 80,
      meta: { className: "hidden sm:table-cell" },
      cell: ({ getValue }) => (
        <span className="font-mono text-sm font-medium text-slate-700">
          {fmtPeriodo(getValue<string>())}
        </span>
      ),
    },
    {
      accessorKey: "gastoTypeName",
      header: "Categoría",
      cell: ({ row, getValue }) => (
        <span className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
            style={{ background: CAT_COLORS[row.original.category] ?? "#94a3b8" }}
          />
          <span className="font-medium text-slate-900">{getValue<string>()}</span>
        </span>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: "Monto",
      size: 150,
      cell: ({ getValue }) => (
        <span className="font-mono font-medium text-slate-900">{formatCOP(getValue<number>())}</span>
      ),
    },
    {
      id: "pct",
      header: "% Total",
      size: 70,
      cell: ({ row }) => {
        const pct = grandTotal > 0 ? (row.original.totalAmount / grandTotal) * 100 : 0
        return <span className="text-xs tabular-nums text-slate-500">{pct.toFixed(1)}%</span>
      },
    },
    {
      id: "change",
      header: "vs anterior",
      size: 110,
      cell: ({ row }) => {
        const { totalAmount, prevAmount } = row.original
        if (!prevAmount) return <span className="text-slate-300 text-xs">—</span>
        const pct = Math.round(((totalAmount - prevAmount) / prevAmount) * 100)
        const delta = totalAmount - prevAmount
        if (pct === 0) return <span className="text-xs text-slate-400">sin cambio</span>
        const up = pct > 0
        return (
          <div className="flex flex-col leading-tight">
            <span className={cn("text-xs font-medium tabular-nums", up ? "text-rose-500" : "text-emerald-600")}>
              {up ? "▲" : "▼"} {Math.abs(pct)}%
            </span>
            <span className="text-xs text-slate-400 tabular-nums">{fmtDelta(delta)}</span>
          </div>
        )
      },
    },
    {
      id: "expand",
      size: 36,
      cell: ({ row }) => (
        <ChevronRight
          className={cn(
            "h-4 w-4 text-slate-400 transition-transform duration-150",
            selectedId === row.original.id && "rotate-90 text-slate-700",
          )}
        />
      ),
    },
  ]

  const table = useReactTable({
    data,
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
          placeholder="Buscar categoría..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className={embedded ? "overflow-x-auto" : "overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"}>
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
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-slate-400">
                  No hay gastos registrados
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => {
                const isActive = selectedId === row.original.id
                return (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedId(isActive ? null : row.original.id)}
                    className={cn(
                      "cursor-pointer border-b border-slate-50 transition-colors",
                      isActive
                        ? "bg-slate-100"
                        : "hover:bg-slate-50",
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn("px-4 py-3", cell.column.columnDef.meta?.className)}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-slate-400">
        {table.getFilteredRowModel().rows.length} de {data.length} categorías
      </p>

      {/* Detail panel — below the table, swaps on row click */}
      {selectedRow && (
        <div className="mt-4">
          <DetailPanel
            row={selectedRow}
            onClose={() => setSelectedId(null)}
          />
        </div>
      )}
    </div>
  )
}
