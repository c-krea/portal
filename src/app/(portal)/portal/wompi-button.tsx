"use client"

import { useState } from "react"
import { CreditCard, X, Copy, Check } from "lucide-react"

const WOMPI_URL = "https://checkout.wompi.co/l/CBEaKx"

type UnitSaldo = { unitNumber: string; saldo: number }

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n)
}

function CopyRow({ label, value, displayValue }: { label: string; value: string; displayValue?: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <div>
      <p className="mb-1 text-xs text-slate-500">{label}</p>
      <div className="flex items-center gap-2">
        <p className="flex-1 rounded-lg bg-slate-100 px-4 py-3 text-center text-2xl font-black tracking-widest text-slate-900">
          {displayValue ?? value}
        </p>
        <button type="button" onClick={handleCopy} title={`Copiar ${label.toLowerCase()}`}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

export function WompiButton({
  units,
  nit,
  tipoPersona,
  hasPp,
  ppPct,
}: {
  units: UnitSaldo[]
  nit: string
  tipoPersona: string | null
  hasPp: boolean
  ppPct: number
}) {
  const [open, setOpen]     = useState(false)
  const [selectedIdx, setSelectedIdx] = useState<number>(units.length === 1 ? 0 : -1)

  const isSingle = units.length === 1

  const selectedSaldo = selectedIdx === -1
    ? units.reduce((s, u) => s + u.saldo, 0)
    : (units[selectedIdx]?.saldo ?? 0)

  function handleOpen() {
    setSelectedIdx(isSingle ? 0 : -1)
    setOpen(true)
  }

  const docLabel = tipoPersona === "PJ" ? "NIT" : "Cédula"

  return (
    <>
      <button onClick={handleOpen}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-4 text-base font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 active:bg-emerald-800">
        <CreditCard className="h-5 w-5" />
        Pagar en línea
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={e => e.stopPropagation()}>

            <div className="mb-4 flex items-start justify-between gap-2">
              <h2 className="text-lg font-bold text-slate-900">Antes de continuar</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Unit selector — only unit numbers, no saldos */}
            {!isSingle && (
              <div className="mb-5">
                <p className="mb-2 text-xs font-medium text-slate-500 uppercase tracking-wider">¿Qué locales cubre este pago?</p>
                <div className="flex gap-1.5 flex-wrap">
                  {units.map((u, idx) => (
                    <button key={u.unitNumber} type="button"
                      onClick={() => setSelectedIdx(idx)}
                      className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                        selectedIdx === idx
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}>
                      Local {u.unitNumber}
                    </button>
                  ))}
                  <button type="button"
                    onClick={() => setSelectedIdx(-1)}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                      selectedIdx === -1
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}>
                    Todos ({units.length})
                  </button>
                </div>
              </div>
            )}

            {/* Copy rows */}
            <div className="space-y-3">
              <CopyRow
                label={`${docLabel} (referencia de pago)`}
                value={nit}
              />
              <CopyRow
                label="Total a pagar"
                value={String(Math.round(selectedSaldo))}
                displayValue={formatCOP(selectedSaldo)}
              />
            </div>

            {/* Notes */}
            <div className="mt-3 space-y-1">
              <p className="text-xs text-slate-400">
                Use su {docLabel} como referencia en el formulario de pago.
              </p>
              {hasPp && (() => {
                const now = new Date()
                const deadline = `10/${String(now.getMonth() + 1).padStart(2, "0")}`
                return (
                  <p className="text-xs font-medium text-emerald-600">
                    Incluye PP {ppPct}% · Válido hasta {deadline}
                  </p>
                )
              })()}
            </div>

            <div className="mt-5 flex gap-3">
              <button onClick={() => setOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Cancelar
              </button>
              <a href={WOMPI_URL} target="_blank" rel="noopener noreferrer"
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-emerald-700">
                Ir a pagar
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
