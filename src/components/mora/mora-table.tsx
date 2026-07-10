"use client"

import { Fragment, useState } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { formatCOP } from "@/lib/formatters"
import type { MoraRow } from "@/lib/data/mora"

type SortKey = "cliente" | "diasMora" | "facturas" | "saldoVencido" | "interes"
type SortDir = "asc" | "desc"

const COLS: { key: SortKey; label: string; align: "left" | "right"; hide?: string }[] = [
  { key: "cliente",      label: "Arrendatario", align: "left" },
  { key: "diasMora",     label: "Días mora",    align: "right" },
  { key: "facturas",     label: "Facturas",     align: "right", hide: "hidden sm:table-cell" },
  { key: "saldoVencido", label: "Saldo vencido", align: "right" },
  { key: "interes",      label: "Interés",      align: "right" },
]

function diasBadge(dias: number) {
  if (dias <= 30) return "bg-amber-50 text-amber-700"
  if (dias <= 60) return "bg-orange-50 text-orange-700"
  return "bg-rose-50 text-rose-700"
}

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y.slice(2)}`
}

export function MoraTable({ data }: { data: MoraRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("saldoVencido")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(key); setSortDir("desc") }
  }

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const sorted = [...data].sort((a, b) => {
    const av = a[sortKey]
    const bv = b[sortKey]
    const sign = sortDir === "asc" ? 1 : -1
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * sign
    return String(av).localeCompare(String(bv)) * sign
  })

  const totalSaldo = data.reduce((s, r) => s + r.saldoVencido, 0)
  const totalInteres = data.reduce((s, r) => s + r.interes, 0)

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="w-8 px-2 py-3" />
            {COLS.map(({ key, label, align, hide }) => {
              const active = sortKey === key
              const indicator = active ? (sortDir === "asc" ? " ↑" : " ↓") : ""
              return (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className={`cursor-pointer select-none px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 hover:text-slate-800 ${
                    align === "right" ? "text-right" : "text-left"
                  }${active ? " text-slate-800" : ""}${hide ? ` ${hide}` : ""}`}
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
              <td colSpan={COLS.length + 1} className="py-12 text-center text-sm text-slate-400">
                No hay clientes en mora
              </td>
            </tr>
          ) : (
            sorted.map((row) => {
              const isOpen = expanded.has(row.tenantId)
              return (
                <Fragment key={row.tenantId}>
                  <tr className="hover:bg-slate-50">
                    <td className="px-2 py-3">
                      <button
                        onClick={() => toggle(row.tenantId)}
                        aria-label={isOpen ? "Contraer" : "Ver facturas"}
                        className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <ChevronRight className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/locales/${row.tenantId}${row.unitNumber ? `?unit=${row.unitNumber}` : ""}`}
                        className="font-medium text-slate-900 hover:text-blue-600 hover:underline"
                      >
                        {row.cliente}
                      </Link>
                      {row.unitNumber && <span className="ml-2 text-xs text-slate-400">#{row.unitNumber}</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${diasBadge(row.diasMora)}`}>
                        {row.diasMora}d
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-right text-slate-700">
                      {row.facturas > 0 ? row.facturas : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-rose-600">
                      {formatCOP(row.saldoVencido)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-violet-700">
                      {formatCOP(row.interes)}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-slate-50/60">
                      <td />
                      <td colSpan={COLS.length} className="px-4 pb-3 pt-0">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-slate-400">
                              <th className="py-1 text-left font-medium">Factura</th>
                              <th className="py-1 text-left font-medium">Unidad</th>
                              <th className="py-1 text-right font-medium">F. factura</th>
                              <th className="py-1 text-right font-medium">Vence</th>
                              <th className="py-1 text-right font-medium">Días</th>
                              <th className="py-1 text-right font-medium">Saldo</th>
                              <th className="py-1 text-right font-medium">Interés</th>
                            </tr>
                          </thead>
                          <tbody>
                            {row.invoices.map((inv) => (
                              <tr key={inv.factura} className="text-slate-600">
                                <td className="py-1 font-mono">{inv.factura}</td>
                                <td className="py-1">{inv.unidad ?? "—"}</td>
                                <td className="py-1 text-right tabular-nums">{fmtDate(inv.fechaFactura)}</td>
                                <td className="py-1 text-right tabular-nums">{fmtDate(inv.vencimiento)}</td>
                                <td className="py-1 text-right tabular-nums">{inv.diasVencidos}d</td>
                                <td className="py-1 text-right font-mono text-rose-600">{formatCOP(inv.saldoVencido)}</td>
                                <td className="py-1 text-right font-mono text-violet-700">{formatCOP(inv.interes)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })
          )}
        </tbody>
        {sorted.length > 0 && (
          <tfoot>
            <tr className="border-t border-slate-200 bg-slate-50 font-semibold">
              <td />
              <td className="px-4 py-2 text-xs uppercase tracking-wider text-slate-500" colSpan={3}>
                Total ({sorted.length})
              </td>
              <td className="px-4 py-2 text-right font-mono text-rose-700">{formatCOP(totalSaldo)}</td>
              <td className="px-4 py-2 text-right font-mono text-violet-700">{formatCOP(totalInteres)}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
