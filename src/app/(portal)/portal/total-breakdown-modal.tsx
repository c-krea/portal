"use client"

import { useState } from "react"
import { X, ChevronRight, Zap, Receipt } from "lucide-react"
import { formatCOP } from "@/lib/formatters"

type Props = {
  canonBase: number
  descuentoPct: number
  canonNeto: number
  ivaAmount: number
  subtotalIva: number
  gastoElec: number
  totalAPagar: number
  kwh: number | null
  medidorExists: boolean
}

export function TotalBreakdownModal({
  canonBase,
  descuentoPct,
  canonNeto,
  ivaAmount,
  subtotalIva,
  gastoElec,
  totalAPagar,
  kwh,
  medidorExists,
}: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
      >
        Ver detalle
        <ChevronRight className="h-3 w-3" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-xl">

              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-slate-400" />
                  <h2 className="text-base font-semibold text-slate-900">Detalle del Cobro</h2>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Line items */}
              <div className="px-6 py-5 space-y-1">

                <LineRow label="Canon base" value={formatCOP(canonBase)} />

                {descuentoPct > 0 && (
                  <LineRow
                    label={`Descuento fase (−${descuentoPct}%)`}
                    value={`−${formatCOP(canonBase - canonNeto)}`}
                    valueClass="text-emerald-600"
                  />
                )}

                {descuentoPct > 0 && (
                  <LineRow label="Canon neto" value={formatCOP(canonNeto)} muted />
                )}

                <LineRow
                  label="IVA 19%"
                  value={`+${formatCOP(ivaAmount)}`}
                />

                <div className="my-2 border-t border-slate-100" />

                <LineRow
                  label="Subtotal arrendamiento"
                  value={formatCOP(subtotalIva)}
                  bold
                />

                {/* Electricity */}
                <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 space-y-1">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Zap className="h-3.5 w-3.5 text-slate-400" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Electricidad
                    </p>
                  </div>
                  {medidorExists && gastoElec > 0 ? (
                    <>
                      {kwh != null && (
                        <LineRow label="Consumo" value={`${kwh.toLocaleString("es-CO")} kWh`} />
                      )}
                      <LineRow label="Total energía" value={formatCOP(gastoElec)} />
                    </>
                  ) : (
                    <p className="text-xs text-slate-400">
                      {medidorExists
                        ? "Lectura registrada — costo pendiente"
                        : "Lectura aún no enviada este mes"}
                    </p>
                  )}
                </div>

                <div className="my-2 border-t border-slate-200" />

                {/* Total */}
                <div className="flex items-baseline justify-between pt-1">
                  <p className="text-sm font-bold text-slate-900">Total a Pagar</p>
                  <p className="text-xl font-black tabular-nums text-slate-900">
                    {formatCOP(totalAPagar)}
                  </p>
                </div>

                <p className="pt-1 text-[11px] text-slate-400">
                  * El descuento por pronto pago se aplica al momento del recaudo si paga dentro de los primeros 10 días.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

function LineRow({
  label,
  value,
  valueClass = "text-slate-700",
  bold = false,
  muted = false,
}: {
  label: string
  value: string
  valueClass?: string
  bold?: boolean
  muted?: boolean
}) {
  return (
    <div className={`flex items-baseline justify-between py-0.5 ${muted ? "opacity-60" : ""}`}>
      <p className={`text-sm ${bold ? "font-semibold text-slate-900" : "text-slate-500"}`}>{label}</p>
      <p className={`text-sm font-medium tabular-nums ${bold ? "text-slate-900" : valueClass}`}>{value}</p>
    </div>
  )
}
