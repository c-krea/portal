"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, BadgePercent, Banknote } from "lucide-react"
import { formatCOP } from "@/lib/formatters"

export type BreakdownRow = {
  periodo: number
  unidad: string | null
  saldo: number
  ppDiscount: number
  vencido: boolean
  ventas: number | null
  impuesto: number | null
  retenciones: number | null
}

function InvoiceRow({ row }: { row: BreakdownRow }) {
  const [open, setOpen] = useState(false)
  const year = Math.floor(row.periodo / 100)
  const month = row.periodo % 100
  const label = new Date(year, month - 1, 1).toLocaleDateString("es-CO", { month: "long", year: "numeric" })
  const displaySaldo = row.ppDiscount > 0 ? row.saldo - row.ppDiscount : row.saldo
  const hasDetail = row.ventas != null || row.ppDiscount > 0

  return (
    <div className="border-b border-slate-50 last:border-0">
      {/* Main row — fully clickable if has detail */}
      <div
        className={`flex items-center justify-between py-2 ${hasDetail ? "cursor-pointer select-none" : ""}`}
        onClick={() => hasDetail && setOpen(v => !v)}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {row.unidad && (
            <span className={`rounded px-1.5 py-0.5 text-xs font-medium shrink-0 transition-colors ${
              open ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-600"
            }`}>
              Local {row.unidad}
            </span>
          )}
          <span className="text-xs font-medium text-slate-700 capitalize truncate">{label}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className={`text-xs font-medium ${row.vencido ? "text-rose-500" : "text-slate-400"}`}>
            {row.vencido ? "Vencida" : "Al día"}
          </span>
          {row.ppDiscount > 0 && (
            <span className="text-xs font-semibold text-emerald-600">PP −{formatCOP(row.ppDiscount)}</span>
          )}
          <span className="text-sm font-semibold text-slate-900 tabular-nums">{formatCOP(displaySaldo)}</span>
          {hasDetail && (
            <span className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${
              open ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-500"
            }`}>
              {open
                ? <ChevronUp className="h-3 w-3" />
                : <ChevronDown className="h-3 w-3" />}
            </span>
          )}
        </div>
      </div>

      {/* Sub-detail — collapsible */}
      {open && (
        <div className="pb-2 pl-2 space-y-0.5">
          {row.ventas != null && (
            <>
              <p className="text-xs text-slate-400">
                Arrendamiento: <span className="text-slate-600">{formatCOP(row.ventas)}</span>
              </p>
              {row.impuesto != null && (
                <p className="text-xs text-slate-400">
                  IVA 19%: <span className="text-slate-600">+{formatCOP(row.impuesto)}</span>
                </p>
              )}
              {(row.retenciones ?? 0) > 0 && (
                <p className="text-xs text-slate-400">
                  Retención: <span className="text-slate-600">−{formatCOP(row.retenciones ?? 0)}</span>
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function CarteraBreakdown({
  saldoTotal,
  saldoConPp,
  ppDiscountTotal,
  isPpWindow,
  ppPct,
  rows,
}: {
  saldoTotal: number
  saldoConPp: number
  ppDiscountTotal: number
  isPpWindow: boolean
  ppPct: number
  rows: BreakdownRow[]
}) {
  const showPp = isPpWindow && ppDiscountTotal > 0
  const displayTotal = showPp ? saldoConPp : saldoTotal

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Banknote className="h-4 w-4 text-slate-400" />
          <p className="text-sm font-semibold text-slate-500">Total a Pagar</p>
        </div>
        {showPp && (
          <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            <BadgePercent className="h-3 w-3" />
            Pronto pago {ppPct}%
          </span>
        )}
      </div>

      {saldoTotal > 0 ? (
        <>
          {/* Grand total row */}
          <div className="flex items-baseline justify-between">
            <p className="text-4xl font-black tabular-nums leading-none text-slate-900">
              {formatCOP(displayTotal)}
            </p>
            {showPp && (
              <p className="text-xl font-black tabular-nums text-emerald-600">
                −{formatCOP(ppDiscountTotal)}
              </p>
            )}
          </div>
          {showPp && (
            <p className="mt-1 text-xs text-slate-400 line-through">{formatCOP(saldoTotal)}</p>
          )}

          {/* Invoice list — always visible, detail per row is collapsible */}
          <div className="mt-3 border-t border-slate-100 pt-1">
            {rows.map((row) => (
              <InvoiceRow key={`${row.periodo}-${row.unidad}`} row={row} />
            ))}

          </div>

          {showPp && (
            <p className="mt-2 text-xs text-slate-400">
              Descuento válido pagando dentro de los 10 días de la factura.
            </p>
          )}
        </>
      ) : (
        <>
          <p className="text-4xl font-black tabular-nums leading-none text-emerald-600">$ 0</p>
          <p className="mt-1 text-xs text-slate-400">Sin facturas pendientes en Siesa</p>
        </>
      )}
    </div>
  )
}
