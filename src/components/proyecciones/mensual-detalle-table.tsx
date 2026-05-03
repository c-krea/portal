"use client"

import { useState } from "react"
import { formatCOP } from "@/lib/formatters"
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

export function MensualDetalleTable({ data }: { data: MensualDetalle[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("unidades")
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
          {sorted.map((row) => (
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
  )
}
