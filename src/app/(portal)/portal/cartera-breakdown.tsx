"use client"

import { Fragment, useState } from "react"
import { ChevronDown, ChevronUp, BadgePercent, Banknote, Zap } from "lucide-react"
import { formatCOP } from "@/lib/formatters"

export type CarteraEnergyInvoice = {
  factura: string
  unidad: string | null
  periodoLabel: string
  total: number
}

export type BreakdownRow = {
  tipo: "arriendo" | "intereses"
  factura: string
  periodo: number
  unidad: string | null
  saldo: number
  ppDiscount: number
  vencido: boolean
  diasMora: number
  fechaFactura: string | null
  vencEfec: string | null
  interes: number
  ventas: number | null
  impuesto: number | null
  retenciones: number | null
}

// Same palette as the Resumen "Detalle de mora": overdue saldo rose, interés
// violet, días badge by urgency; not-yet-due (corriente) in sky.
function diasBadge(dias: number) {
  if (dias <= 30) return "bg-amber-50 text-amber-700"
  if (dias <= 60) return "bg-orange-50 text-orange-700"
  return "bg-rose-50 text-rose-700"
}

function fmtDate(iso: string | null) {
  if (!iso) return "—"
  const [y, m, d] = iso.slice(0, 10).split("-")
  return `${d}/${m}/${y.slice(2)}`
}

function mesLabel(row: BreakdownRow) {
  const year = Math.floor(row.periodo / 100)
  const month = row.periodo % 100
  const mes = new Date(year, month - 1, 1).toLocaleDateString("es-CO", { month: "long", year: "numeric" })
  return row.tipo === "intereses" ? `Intereses de mora · ${mes}` : mes
}

const COLS = 8 // toggle + 7 data columns

function InvoiceRow({ row }: { row: BreakdownRow }) {
  const [open, setOpen] = useState(false)
  const enMora = row.vencido && row.diasMora > 0
  const displaySaldo = row.ppDiscount > 0 ? row.saldo - row.ppDiscount : row.saldo
  const hasDetail = row.ventas != null || row.ppDiscount > 0

  return (
    <Fragment>
      <tr
        className={`border-b border-slate-50 ${hasDetail ? "cursor-pointer select-none hover:bg-slate-50" : ""}`}
        onClick={() => hasDetail && setOpen((v) => !v)}
      >
        <td className="w-6 py-2 pl-1">
          {hasDetail && (
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${
                open ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </span>
          )}
        </td>
        <td className="py-2 pr-2">
          <p className="font-mono text-xs text-slate-700">{row.factura}</p>
          <p className="truncate text-[0.6875rem] capitalize text-slate-400">{mesLabel(row)}</p>
        </td>
        <td className="py-2 pr-2 text-xs text-slate-600">{row.unidad ?? "—"}</td>
        <td className="py-2 pr-2 text-right">
          {enMora ? (
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${diasBadge(row.diasMora)}`}>
              {row.diasMora}d
            </span>
          ) : (
            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium tabular-nums text-sky-600">0d</span>
          )}
        </td>
        <td className="hidden py-2 pr-2 text-right text-xs tabular-nums text-slate-600 sm:table-cell">
          {fmtDate(row.fechaFactura)}
        </td>
        <td className="hidden py-2 pr-2 text-right text-xs tabular-nums text-slate-600 sm:table-cell">
          {fmtDate(row.vencEfec)}
        </td>
        <td className="py-2 pr-2 text-right">
          <p className={`text-sm font-semibold tabular-nums ${enMora ? "text-rose-600" : "text-sky-600"}`}>
            {formatCOP(displaySaldo)}
          </p>
          {row.ppDiscount > 0 && (
            <p className="text-[0.6875rem] font-semibold text-emerald-600">PP −{formatCOP(row.ppDiscount)}</p>
          )}
        </td>
        <td className="py-2 text-right text-xs tabular-nums">
          {row.interes > 0 ? (
            <span className="font-medium text-violet-700">{formatCOP(row.interes)}</span>
          ) : (
            <span className="text-slate-300">—</span>
          )}
        </td>
      </tr>

      {/* Sub-detail — collapsible: arrendamiento / IVA / retención (+ PP) */}
      {open && (
        <tr className="bg-slate-50/60">
          <td />
          <td colSpan={COLS - 1} className="space-y-0.5 pb-2 pt-1">
            {row.ventas != null && (
              <>
                <p className="text-xs text-slate-400">
                  {row.tipo === "intereses" ? "Intereses" : "Arrendamiento"}:{" "}
                  <span className="text-slate-600">{formatCOP(row.ventas)}</span>
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
            {row.ppDiscount > 0 && (
              <p className="text-xs text-slate-400">
                Pronto pago: <span className="text-emerald-600">−{formatCOP(row.ppDiscount)}</span>
              </p>
            )}
          </td>
        </tr>
      )}
    </Fragment>
  )
}

export function CarteraBreakdown({
  saldoTotal,
  saldoConPp,
  ppDiscountTotal,
  isPpWindow,
  ppPct,
  rows,
  electricityInvoices = [],
}: {
  saldoTotal: number
  saldoConPp: number
  ppDiscountTotal: number
  isPpWindow: boolean
  ppPct: number
  rows: BreakdownRow[]
  electricityInvoices?: CarteraEnergyInvoice[]
}) {
  const showPp = isPpWindow && ppDiscountTotal > 0
  const energyTotal = electricityInvoices.reduce((s, inv) => s + inv.total, 0)
  const rentDisplay = showPp ? saldoConPp : saldoTotal
  const displayTotal = rentDisplay + energyTotal
  const hasContent = saldoTotal > 0 || energyTotal > 0

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

      {hasContent ? (
        <>
          {/* Grand total row — rent display (+ PP) + energy */}
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
            <p className="mt-1 text-xs text-slate-400 line-through">{formatCOP(saldoTotal + energyTotal)}</p>
          )}

          {/* Invoice table — same columns as the Resumen "Detalle de mora";
              each row still opens its arrendamiento / IVA / retención detail. */}
          <div className="-mx-1 mt-3 overflow-x-auto border-t border-slate-100 pt-1">
            <table className="w-full min-w-[22rem] text-sm">
              <thead>
                <tr className="text-[0.6875rem] uppercase tracking-wider text-slate-400">
                  <th className="w-6" />
                  <th className="py-1.5 pr-2 text-left font-medium">Factura</th>
                  <th className="py-1.5 pr-2 text-left font-medium">Local</th>
                  <th className="py-1.5 pr-2 text-right font-medium">Días</th>
                  <th className="hidden py-1.5 pr-2 text-right font-medium sm:table-cell">F. factura</th>
                  <th className="hidden py-1.5 pr-2 text-right font-medium sm:table-cell">Vence</th>
                  <th className="py-1.5 pr-2 text-right font-medium">Saldo</th>
                  <th className="py-1.5 text-right font-medium">Interés</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <InvoiceRow key={row.factura} row={row} />
                ))}
                {electricityInvoices.map((inv) => (
                  <tr key={inv.factura} className="border-b border-slate-50">
                    <td />
                    <td className="py-2 pr-2">
                      <p className="font-mono text-xs text-slate-700">{inv.factura}</p>
                      <p className="flex items-center gap-1 truncate text-[0.6875rem] text-slate-400">
                        <Zap className="h-3 w-3 shrink-0 text-amber-500" />
                        Energía · {inv.periodoLabel}
                      </p>
                    </td>
                    <td className="py-2 pr-2 text-xs text-slate-600">{inv.unidad ?? "—"}</td>
                    <td className="py-2 pr-2 text-right text-xs text-slate-300">—</td>
                    <td className="hidden py-2 pr-2 text-right text-xs text-slate-300 sm:table-cell">—</td>
                    <td className="hidden py-2 pr-2 text-right text-xs text-slate-300 sm:table-cell">—</td>
                    <td className="py-2 pr-2 text-right text-sm font-semibold tabular-nums text-amber-600">
                      {formatCOP(inv.total)}
                    </td>
                    <td className="py-2 text-right text-xs text-slate-300">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
