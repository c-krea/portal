"use client"

import { useState } from "react"
import Link from "next/link"
import { formatCOP } from "@/lib/formatters"
import type { MoraRow } from "@/lib/data/mora"

type SortKey = "cliente" | "diasMora" | "mesesPendientes" | "saldoVencido" | "saldoTotal"
type SortDir = "asc" | "desc"

const COLS: { key: SortKey; label: string; align: "left" | "right" }[] = [
  { key: "cliente",         label: "Arrendatario",     align: "left" },
  { key: "diasMora",        label: "Días mora",        align: "right" },
  { key: "mesesPendientes", label: "Facturas",         align: "right" },
  { key: "saldoVencido",    label: "Vencido",          align: "right" },
  { key: "saldoTotal",      label: "Saldo total",      align: "right" },
]

function diasBadge(dias: number) {
  if (dias <= 30) return "bg-amber-50 text-amber-700"
  if (dias <= 60) return "bg-orange-50 text-orange-700"
  return "bg-rose-50 text-rose-700"
}

export function MoraTable({ data }: { data: MoraRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("diasMora")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  const sorted = [...data].sort((a, b) => {
    const av = a[sortKey]
    const bv = b[sortKey]
    const sign = sortDir === "asc" ? 1 : -1
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * sign
    return String(av).localeCompare(String(bv)) * sign
  })

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
                    align === "right" ? "text-right" : "text-left"
                  }${active ? " text-slate-800" : ""}`}
                >
                  {label}{indicator}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={COLS.length} className="py-12 text-center text-sm text-slate-400">
                No hay clientes en mora
              </td>
            </tr>
          ) : (
            sorted.map((row) => (
              <tr key={row.tenantId} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/clientes/${row.tenantId}`}
                    className="font-medium text-slate-900 hover:text-blue-600 hover:underline"
                  >
                    {row.cliente}
                  </Link>
                  {row.unitNumber && (
                    <span className="ml-2 text-xs text-slate-400">#{row.unitNumber}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${diasBadge(row.diasMora)}`}>
                    {row.diasMora}d
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-slate-700">
                  {row.mesesPendientes > 0 ? row.mesesPendientes : "—"}
                </td>
                <td className="px-4 py-3 text-right font-mono font-semibold text-rose-600">
                  {formatCOP(row.saldoVencido)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-700">
                  {formatCOP(row.saldoTotal)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
        {sorted.length} clientes en mora
      </div>
    </div>
  )
}
