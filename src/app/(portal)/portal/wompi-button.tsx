"use client"

import { useState } from "react"
import { CreditCard, Home, Zap, X, Copy, Check, ChevronLeft } from "lucide-react"
import type { PortalElectricityInvoiceData } from "@/lib/data/portal"

const WOMPI_URL = "https://checkout.wompi.co/l/CBEaKx"

type UnitSaldo = { unitNumber: string; saldo: number }
type Step = "type" | "arriendo" | "energia"

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n)
}
function formatKwh(n: number) {
  return new Intl.NumberFormat("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n)
}
function formatTarifa(n: number) {
  return new Intl.NumberFormat("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
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

function DataLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1 text-sm">
      <span className="font-semibold text-slate-700 shrink-0">{label}</span>
      <span className="text-slate-600">{value}</span>
    </div>
  )
}

export function WompiButton({
  units,
  nit,
  tipoPersona,
  hasPp,
  ppPct,
  electricityInvoices,
}: {
  units: UnitSaldo[]
  nit: string
  tipoPersona: string | null
  hasPp: boolean
  ppPct: number
  electricityInvoices: PortalElectricityInvoiceData[]
}) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>("type")
  const [selectedIdx, setSelectedIdx] = useState<number>(units.length === 1 ? 0 : -1)

  const isSingle = units.length === 1
  const hasElectricity = electricityInvoices.length > 0
  const totalElectricity = electricityInvoices.reduce((s, inv) => s + inv.total, 0)
  const docLabel = tipoPersona === "PJ" ? "NIT" : tipoPersona === "PN" ? "Cédula" : "Documento"

  const selectedSaldo = selectedIdx === -1
    ? units.reduce((s, u) => s + u.saldo, 0)
    : (units[selectedIdx]?.saldo ?? 0)

  function handleOpen() {
    setSelectedIdx(isSingle ? 0 : -1)
    // Skip type selector if no electricity invoice this period
    setStep(hasElectricity ? "type" : "arriendo")
    setOpen(true)
  }

  function handleClose() {
    setOpen(false)
  }

  return (
    <>
      <button onClick={handleOpen}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-4 text-base font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 active:bg-emerald-800">
        <CreditCard className="h-5 w-5" />
        Pagar en línea
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={handleClose}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={e => e.stopPropagation()}>

            {/* ── Step 0: type selector ── */}
            {step === "type" && (
              <>
                <div className="mb-5 flex items-start justify-between gap-2">
                  <h2 className="text-lg font-bold text-slate-900">¿Qué va a pagar?</h2>
                  <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setStep("arriendo")}
                    className="flex flex-col items-center gap-3 rounded-xl border-2 border-slate-200 p-5 text-slate-700 transition-colors hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700">
                    <Home className="h-8 w-8" />
                    <span className="text-sm font-semibold">Arriendo</span>
                  </button>
                  <button onClick={() => setStep("energia")}
                    className="flex flex-col items-center gap-3 rounded-xl border-2 border-slate-200 p-5 text-slate-700 transition-colors hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700">
                    <Zap className="h-8 w-8" />
                    <span className="text-sm font-semibold">Energía</span>
                  </button>
                </div>
              </>
            )}

            {/* ── Step arriendo: existing flow ── */}
            {step === "arriendo" && (
              <>
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {hasElectricity && (
                      <button onClick={() => setStep("type")} className="text-slate-400 hover:text-slate-600">
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                    )}
                    <h2 className="text-lg font-bold text-slate-900">Antes de continuar</h2>
                  </div>
                  <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>

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

                <div className="space-y-3">
                  <CopyRow label={`${docLabel} (referencia de pago)`} value={nit} />
                  <CopyRow
                    label="Total a pagar"
                    value={String(Math.round(selectedSaldo))}
                    displayValue={formatCOP(selectedSaldo)}
                  />
                </div>

                <div className="mt-3 space-y-2">
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                    <p className="text-xs text-amber-800">
                      <span className="font-semibold">Importante:</span> en el campo <span className="font-semibold">"# Local"</span> de Wompi ingrese su {docLabel}, no el número de su local. El mes lo ingresa normalmente.
                    </p>
                  </div>
                  {hasPp && (
                    <p className="text-xs font-medium text-emerald-600">
                      Incluye PP {ppPct}% · Válido dentro de los 10 días de la factura
                    </p>
                  )}
                </div>

                <div className="mt-5 flex gap-3">
                  <button onClick={handleClose}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    Cancelar
                  </button>
                  <a href={WOMPI_URL} target="_blank" rel="noopener noreferrer"
                    className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-emerald-700">
                    Ir a pagar
                  </a>
                </div>
              </>
            )}

            {/* ── Step energia ── */}
            {step === "energia" && hasElectricity && (
              <>
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setStep("type")} className="text-slate-400 hover:text-slate-600">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h2 className="text-lg font-bold text-slate-900">Pago de Energía</h2>
                  </div>
                  <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Unit cards — scrollable row */}
                <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                  {electricityInvoices.map(inv => (
                    <div key={inv.unidad}
                      className="flex-none w-52 rounded-xl border border-slate-200 bg-slate-50 p-2.5 space-y-0.5">
                      <p className="text-xs font-bold text-slate-900 mb-1.5">Local {inv.unidad}</p>
                      {[
                        ["Proveedor",  inv.proveedor],
                        ["NIT",        inv.proveedorNit],
                        ["Contrato",   inv.contrato],
                        ["Periodo",    inv.periodoLabel],
                        ["Consumo",    `${formatKwh(inv.consumoKwh)} kWh`],
                        ["Tarifa kWh", `$ ${formatTarifa(inv.tarifaKwh)}`],
                        ["Dirección",  inv.direccion],
                      ].map(([label, value]) => (
                        <div key={label} className="flex gap-1">
                          <span className="text-[10px] font-semibold text-slate-500 shrink-0">{label}:</span>
                          <span className="text-[10px] text-slate-700 leading-tight">{value}</span>
                        </div>
                      ))}
                      <p className="text-xs font-bold text-slate-900 pt-1.5 border-t border-slate-200 mt-1.5">
                        {formatCOP(inv.total)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Accounting note */}
                <div className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3">
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    <span className="font-bold">Nota contable: </span>
                    Al ser un reintegro de gasto, registre el gasto al proveedor de energía en su contabilidad. Manufacturas Reymon S.A. actúa solo como intermediario.
                  </p>
                </div>

                {/* Copy rows */}
                <div className="space-y-3">
                  <CopyRow label={`${docLabel} (referencia de pago)`} value={nit} />
                  <CopyRow
                    label="Total energía a pagar"
                    value={String(Math.round(totalElectricity))}
                    displayValue={formatCOP(totalElectricity)}
                  />
                </div>

                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <p className="text-xs text-amber-800">
                    <span className="font-semibold">Importante:</span> en el campo <span className="font-semibold">"# Local"</span> de Wompi ingrese su {docLabel}, no el número de su local. El mes lo ingresa normalmente.
                  </p>
                </div>

                <div className="mt-5 flex gap-3">
                  <button onClick={handleClose}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    Cancelar
                  </button>
                  <a href={WOMPI_URL} target="_blank" rel="noopener noreferrer"
                    className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-emerald-700">
                    Ir a pagar
                  </a>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </>
  )
}
