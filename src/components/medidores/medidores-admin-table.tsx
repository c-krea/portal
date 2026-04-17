"use client"

import { useState } from "react"
import { formatCOP } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import type { MedidorAdminRow, UnitWithMeter } from "@/lib/data/medidores"
import { LecturaForm } from "@/components/medidores/lectura-form"
import { X } from "lucide-react"

type SortKey = "unitNumber" | "tenantName" | "kwh" | "desvPct" | "totalEnergia"
type SortDir = "asc" | "desc"

function StatusBadge({ status }: { status: MedidorAdminRow["status"] }) {
  if (status === "registrada")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
        ✓ Registrada
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
      ⏳ Sin lectura
    </span>
  )
}

function DesvBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-slate-300">—</span>
  const abs = Math.abs(pct)
  const color =
    abs <= 10 ? "text-emerald-600" : abs <= 25 ? "text-amber-600" : "text-rose-600"
  return (
    <span className={cn("font-mono text-xs font-medium", color)}>
      {pct > 0 ? "+" : ""}{pct}%
    </span>
  )
}

export function MedidoresAdminTable({
  rows,
  units,
  periodo,
}: {
  rows: MedidorAdminRow[]
  units: UnitWithMeter[]
  periodo: string
}) {
  const [sortKey, setSortKey] = useState<SortKey>("unitNumber")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [filter, setFilter]   = useState<"all" | "registrada" | "sin_lectura">("all")
  const [showForm, setShowForm] = useState(false)

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(key); setSortDir("asc") }
  }

  const filtered = rows.filter((r) => filter === "all" || r.status === filter)

  const sorted = [...filtered].sort((a, b) => {
    const sign = sortDir === "asc" ? 1 : -1
    if (sortKey === "unitNumber")
      return a.unitNumber.localeCompare(b.unitNumber, "es") * sign
    if (sortKey === "tenantName")
      return (a.tenantName ?? "").localeCompare(b.tenantName ?? "", "es") * sign
    const av = (a[sortKey] as number | null) ?? -Infinity
    const bv = (b[sortKey] as number | null) ?? -Infinity
    return (av - bv) * sign
  })

  const COLS: { key: SortKey; label: string; align: "left" | "right" }[] = [
    { key: "unitNumber",   label: "Local",         align: "left" },
    { key: "tenantName",   label: "Arrendatario",  align: "left" },
    { key: "kwh",          label: "kWh",           align: "right" },
    { key: "desvPct",      label: "vs Prom.3m",    align: "right" },
    { key: "totalEnergia", label: "Total",          align: "right" },
  ]

  return (
    <div>
      {/* Controls row */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1 text-xs">
          {(["all", "registrada", "sin_lectura"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-3 py-1 font-medium transition-colors",
                filter === f
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              {f === "all" ? "Todos" : f === "registrada" ? "Registradas" : "Sin lectura"}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          {showForm ? <X className="h-3.5 w-3.5" /> : "+ "}
          Registrar lectura
        </button>
      </div>

      {/* Manual entry form */}
      {showForm && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Registrar Lectura Manual</h2>
          <LecturaForm units={units} />
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {COLS.map(({ key, label, align }) => {
                const active = sortKey === key
                const ind = active ? (sortDir === "asc" ? " ↑" : " ↓") : ""
                return (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className={cn(
                      "cursor-pointer select-none px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 hover:text-slate-800",
                      align === "right" ? "text-right" : "text-left",
                      active && "text-slate-800",
                    )}
                  >
                    {label}{ind}
                  </th>
                )
              })}
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sorted.map((row) => (
              <tr key={row.unitId} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-sm font-medium text-slate-700">
                  {row.unitNumber}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {row.tenantName ?? <span className="text-slate-300">—</span>}
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-900">
                  {row.kwh != null ? row.kwh.toLocaleString("es-CO") : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <DesvBadge pct={row.desvPct} />
                  {row.promedio3m != null && (
                    <span className="ml-1 text-[10px] text-slate-400">
                      (p3m: {row.promedio3m.toLocaleString("es-CO")})
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-900">
                  {row.totalEnergia != null ? formatCOP(row.totalEnergia) : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
          {sorted.length} de {rows.length} unidades · {periodo}
        </div>
      </div>
    </div>
  )
}
