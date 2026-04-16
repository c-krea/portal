"use client"

import { useState } from "react"
import { formatCOP } from "@/lib/formatters"
import type { ProyeccionDetalle } from "@/lib/data/proyecciones"

const STATUS_LABEL: Record<string, string> = {
  activo:   "Activo",
  critico:  "Crítico",
  inactivo: "Inactivo",
  moroso:   "Moroso",
}

const STATUS_COLOR: Record<string, string> = {
  activo:   "bg-emerald-50 text-emerald-700",
  critico:  "bg-rose-50 text-rose-700",
  inactivo: "bg-slate-100 text-slate-500",
  moroso:   "bg-amber-50 text-amber-700",
}

function formatDate(raw: string | null): string {
  if (!raw) return "—"
  const d = new Date(raw)
  const dd = String(d.getUTCDate()).padStart(2, "0")
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0")
  const yy = String(d.getUTCFullYear()).slice(2)
  return `${dd}/${mm}/${yy}`
}

type SortKey = keyof Pick<
  ProyeccionDetalle,
  "unitNumber" | "cliente" | "fechaInicio" | "mesesTranscurridos" | "canonMensual" | "descuentoPct" | "prontoPagoPct" | "netoAnualIVA" | "status"
>

type SortDir = "asc" | "desc"

const COLS: { key: SortKey; label: string; align: "left" | "right" | "center" }[] = [
  { key: "unitNumber",         label: "Local",           align: "left" },
  { key: "cliente",            label: "Arrendatario",    align: "left" },
  { key: "fechaInicio",        label: "Desde",           align: "left" },
  { key: "mesesTranscurridos", label: "Meses",           align: "right" },
  { key: "canonMensual",       label: "Canon / mes",     align: "right" },
  { key: "descuentoPct",       label: "Dcto %",          align: "right" },
  { key: "prontoPagoPct",      label: "PP %",            align: "right" },
  { key: "netoAnualIVA",       label: "Neto anual c/IVA",align: "right" },
  { key: "status",             label: "Estado",          align: "center" },
]

function compare(a: ProyeccionDetalle, b: ProyeccionDetalle, key: SortKey, dir: SortDir): number {
  const av = a[key]
  const bv = b[key]
  const sign = dir === "asc" ? 1 : -1
  if (av === null && bv === null) return 0
  if (av === null) return sign
  if (bv === null) return -sign
  if (typeof av === "number" && typeof bv === "number") return (av - bv) * sign
  return String(av).localeCompare(String(bv)) * sign
}

export function DetalleTable({ data }: { data: ProyeccionDetalle[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("unitNumber")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const sorted = [...data].sort((a, b) => compare(a, b, sortKey, sortDir))

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            {COLS.map(({ key, label, align }) => {
              const active = sortKey === key
              const indicator = active ? (sortDir === "asc" ? " ↑" : " ↓") : ""
              return (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className={`cursor-pointer select-none px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 hover:text-slate-800 ${
                    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
                  }${active ? " text-slate-800" : ""}`}
                >
                  {label}{indicator}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {sorted.map((row) => (
            <tr key={row.contractId} className="hover:bg-slate-50">
              <td className="px-4 py-2.5 font-mono text-xs font-semibold text-slate-800">{row.unitNumber}</td>
              <td className="px-4 py-2.5 text-slate-700">{row.cliente}</td>
              <td className="px-4 py-2.5 text-xs text-slate-500">{formatDate(row.fechaInicio)}</td>
              <td className="px-4 py-2.5 text-right text-slate-700">{row.mesesTranscurridos}</td>
              <td className="px-4 py-2.5 text-right font-mono text-slate-900">{formatCOP(row.canonMensual)}</td>
              <td className="px-4 py-2.5 text-right text-slate-600">
                {row.descuentoPct > 0 ? (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                    {row.descuentoPct}%
                  </span>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-right text-slate-600">
                {row.prontoPagoPct > 0 ? (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {row.prontoPagoPct}%
                  </span>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-900">{formatCOP(row.netoAnualIVA)}</td>
              <td className="px-4 py-2.5 text-center">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[row.status] ?? "bg-slate-100 text-slate-500"}`}>
                  {STATUS_LABEL[row.status] ?? row.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
