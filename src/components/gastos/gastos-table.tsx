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

function fmtPeriodo(p: string) {
  const [year, month] = p.split("-")
  return `${month}/${year?.slice(2)}`
}
import { formatCOP } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import type { GastoRow } from "@/lib/data/gastos"

const CATEGORY_LABELS: Record<string, string> = {
  servicios_publicos: "Servicios Públicos",
  aseo_cafeteria: "Aseo y Cafetería",
  vigilancia: "Vigilancia",
  nomina: "Nómina",
  publicidad: "Publicidad",
  reparaciones: "Reparaciones",
  impuestos: "Impuestos",
  otros: "Otros",
}

const METHOD_LABELS: Record<string, string> = {
  pro_rata: "Pro Rata",
  fixed: "Fijo",
  metered: "Medidor",
  percentage: "Porcentaje",
}

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    className?: string
  }
}

const columns: ColumnDef<GastoRow>[] = [
  {
    accessorKey: "periodo",
    header: "Período",
    size: 100,
    meta: { className: "hidden sm:table-cell" },
    cell: ({ getValue }) => (
      <span className="font-mono text-sm font-medium text-slate-700">{fmtPeriodo(getValue<string>())}</span>
    ),
  },
  {
    accessorKey: "gastoTypeName",
    header: "Tipo de Gasto",
    cell: ({ getValue }) => (
      <span className="text-slate-900">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "category",
    header: "Categoría",
    size: 160,
    meta: { className: "hidden md:table-cell" },
    cell: ({ getValue }) => (
      <span className="text-slate-600">
        {CATEGORY_LABELS[getValue<string>()] ?? getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: "allocationMethod",
    header: "Método",
    size: 110,
    meta: { className: "hidden md:table-cell" },
    cell: ({ getValue }) => (
      <span className="text-xs text-slate-500">
        {METHOD_LABELS[getValue<string>()] ?? getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: "totalAmount",
    header: "Monto",
    size: 140,
    cell: ({ getValue }) => (
      <span className="font-medium text-slate-900">{formatCOP(getValue<number>())}</span>
    ),
  },
  {
    accessorKey: "description",
    header: "Descripción",
    meta: { className: "hidden lg:table-cell" },
    cell: ({ getValue }) => (
      <span className="text-xs text-slate-500">{getValue<string | null>() ?? "—"}</span>
    ),
  },
]

export function GastosTable({ data, embedded = false }: { data: GastoRow[]; embedded?: boolean }) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "periodo", desc: true },
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
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar gasto..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

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
                      header.column.getCanSort() &&
                        "cursor-pointer select-none hover:text-slate-700",
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
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-slate-400"
                >
                  No hay gastos registrados
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-50 hover:bg-slate-50"
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
        {table.getFilteredRowModel().rows.length} de {data.length} registros
      </p>
    </div>
  )
}
