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
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { formatCOP } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import type { MoraRow } from "@/lib/data/mora"

function diasMoraLabel(dias: number) {
  if (dias <= 30) return { label: "Leve", class: "bg-amber-50 text-amber-700" }
  if (dias <= 90) return { label: "Moderado", class: "bg-orange-50 text-orange-700" }
  return { label: "Crítico", class: "bg-rose-50 text-rose-700" }
}

const columns: ColumnDef<MoraRow>[] = [
  {
    accessorKey: "unitNumber",
    header: "Local",
    size: 90,
    cell: ({ getValue }) => (
      <span className="font-medium text-slate-700">{getValue<string>() ?? "—"}</span>
    ),
  },
  {
    accessorKey: "cliente",
    header: "Cliente",
    cell: ({ getValue }) => (
      <span className="font-medium text-slate-900">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "diasMora",
    header: "Días en Mora",
    size: 130,
    cell: ({ getValue }) => {
      const dias = getValue<number>()
      const { label, class: cls } = diasMoraLabel(dias)
      return (
        <div className="flex items-center gap-2">
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", cls)}>
            {label}
          </span>
          <span className="text-slate-600">{dias}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "saldoVencido",
    header: "Saldo Vencido",
    size: 150,
    cell: ({ getValue }) => (
      <span className="text-right font-medium text-rose-600">
        {formatCOP(getValue<number>())}
      </span>
    ),
  },
  {
    accessorKey: "interesAcumulado",
    header: "Interés Acum.",
    size: 130,
    cell: ({ getValue }) => (
      <span className="text-right text-slate-600">
        {formatCOP(getValue<number>())}
      </span>
    ),
  },
  {
    accessorKey: "saldoTotal",
    header: "Saldo Total",
    size: 130,
    cell: ({ getValue }) => (
      <span className="text-right font-semibold text-slate-900">
        {formatCOP(getValue<number>())}
      </span>
    ),
  },
]

export function MoraTable({ data }: { data: MoraRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "diasMora", desc: true },
  ])
  const [globalFilter, setGlobalFilter] = useState("")

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
          placeholder="Buscar cliente o local..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
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
                    className={cn(
                      "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500",
                      header.column.getCanSort() && "cursor-pointer select-none hover:text-slate-700"
                    )}
                    style={{ width: header.column.columnDef.size }}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className="text-slate-300">
                          {header.column.getIsSorted() === "asc" ? (
                            <ArrowUp className="h-3 w-3 text-slate-500" />
                          ) : header.column.getIsSorted() === "desc" ? (
                            <ArrowDown className="h-3 w-3 text-slate-500" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-slate-400"
                >
                  No hay clientes en mora
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-50 hover:bg-slate-50"
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

      {/* Footer */}
      <p className="mt-2 text-xs text-slate-400">
        {table.getFilteredRowModel().rows.length} clientes
      </p>
    </div>
  )
}
