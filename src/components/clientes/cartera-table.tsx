"use client"

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { useState } from "react"
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"
import { formatCOP, formatDateShort } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import type { CarteraItem } from "@/lib/data/tenant-detail"

function MoraBadge({ dias }: { dias: number }) {
  if (dias === 0) return <span className="text-slate-400">—</span>
  const cfg =
    dias > 90
      ? { cls: "bg-rose-100 text-rose-700", label: `${dias}d` }
      : dias > 30
        ? { cls: "bg-orange-100 text-orange-700", label: `${dias}d` }
        : { cls: "bg-amber-100 text-amber-700", label: `${dias}d` }
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", cfg.cls)}>
      {cfg.label}
    </span>
  )
}

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    className?: string
  }
}

const columns: ColumnDef<CarteraItem>[] = [
  {
    accessorKey: "siesaFactura",
    header: "Factura",
    size: 120,
    meta: { className: "hidden md:table-cell" },
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-slate-600">{getValue<string | null>() ?? "—"}</span>
    ),
  },
  {
    accessorKey: "fechaFactura",
    header: "Fecha",
    size: 100,
    cell: ({ getValue }) => {
      const v = getValue<string | null>()
      return <span className="text-slate-600">{v ? formatDateShort(v) : "—"}</span>
    },
  },
  {
    accessorKey: "fechaVence",
    header: "Vence",
    size: 100,
    meta: { className: "hidden sm:table-cell" },
    cell: ({ getValue }) => {
      const v = getValue<string | null>()
      return <span className="text-slate-600">{v ? formatDateShort(v) : "—"}</span>
    },
  },
  {
    accessorKey: "diasMora",
    header: "Mora",
    size: 90,
    cell: ({ getValue }) => <MoraBadge dias={getValue<number>()} />,
  },
  {
    accessorKey: "saldo",
    header: "Saldo",
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
    accessorKey: "valorVencido",
    header: "Vencido",
    size: 130,
    meta: { className: "hidden sm:table-cell" },
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
    accessorKey: "interesAcumulado",
    header: "Interés",
    size: 120,
    meta: { className: "hidden md:table-cell" },
    cell: ({ getValue }) => {
      const v = getValue<number>()
      return v > 0 ? (
        <span className="text-rose-500">{formatCOP(v)}</span>
      ) : (
        <span className="text-slate-400">—</span>
      )
    },
  },
  {
    accessorKey: "observacion",
    header: "Nota",
    meta: { className: "hidden lg:table-cell" },
    cell: ({ getValue }) => (
      <span className="text-xs text-slate-500">{getValue<string | null>() ?? ""}</span>
    ),
  },
]

export function CarteraTable({ data }: { data: CarteraItem[] }) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "diasMora", desc: true },
  ])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
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
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50">
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
  )
}
