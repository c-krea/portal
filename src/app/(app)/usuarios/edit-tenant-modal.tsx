"use client"

import { useState, useTransition } from "react"
import { Pencil, X, Loader2, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react"
import { updateTenantUser } from "./actions"
import type { PortalTenantRow } from "@/lib/data/usuarios"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">{label}</label>
      {children}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, disabled }: {
  value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
    />
  )
}

export function EditTenantModal({ tenant }: { tenant: PortalTenantRow }) {
  const multiUnit = tenant.unitIds.length > 1
  const hasContract = !!tenant.contractId && !multiUnit

  const [open, setOpen]             = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [contractOpen, setContractOpen] = useState(false)
  const [pending, startTransition]  = useTransition()
  const [error, setError]           = useState<string | null>(null)

  // Identity fields
  const [nombre, setNombre]         = useState(tenant.nombre)
  const [unitNumber, setUnitNumber] = useState(tenant.units)
  const [email, setEmail]           = useState(tenant.portalEmail ?? "")

  // Contract fields
  const [canonBase, setCanonBase]   = useState(String(tenant.canonBase ?? ""))
  const [descuentoPct, setDescuentoPct] = useState(String(tenant.descuentoPct ?? ""))
  const [prontoPagoPct, setProntoPagoPct] = useState(String(tenant.prontoPagoPct ?? ""))
  const [fechaInicio, setFechaInicio] = useState(tenant.fechaInicio ?? "")
  const [fechaFin, setFechaFin]     = useState(tenant.fechaFin ?? "")
  const [descripcion, setDescripcion] = useState(tenant.descripcionDescuentos ?? "")

  function openModal() {
    setNombre(tenant.nombre)
    setUnitNumber(tenant.units)
    setEmail(tenant.portalEmail ?? "")
    setCanonBase(String(tenant.canonBase ?? ""))
    setDescuentoPct(String(tenant.descuentoPct ?? ""))
    setProntoPagoPct(String(tenant.prontoPagoPct ?? ""))
    setFechaInicio(tenant.fechaInicio ?? "")
    setFechaFin(tenant.fechaFin ?? "")
    setDescripcion(tenant.descripcionDescuentos ?? "")
    setError(null)
    setConfirming(false)
    setContractOpen(false)
    setOpen(true)
  }

  function handleSaveClick() {
    setError(null)
    if (!nombre.trim()) { setError("El nombre es obligatorio"); return }
    if (email && !email.includes("@")) { setError("Email inválido"); return }
    const canon = parseFloat(canonBase)
    if (hasContract && (isNaN(canon) || canon <= 0)) { setError("Canon base inválido"); return }
    setConfirming(true)
  }

  function handleConfirm() {
    startTransition(async () => {
      const result = await updateTenantUser(tenant.tenantId, tenant.unitIds, {
        nombre,
        portalEmail: email,
        unitNumber,
        ...(hasContract && {
          contractId:           tenant.contractId!,
          canonBase:            parseFloat(canonBase),
          descuentoPct:         descuentoPct ? parseFloat(descuentoPct) : null,
          prontoPagoPct:        prontoPagoPct ? parseFloat(prontoPagoPct) : null,
          fechaInicio:          fechaInicio || undefined,
          fechaFin:             fechaFin || null,
          descripcionDescuentos: descripcion || null,
        }),
      })
      if (result.error) {
        setError(result.error)
        setConfirming(false)
      } else {
        setOpen(false)
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={openModal}
        className="rounded p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        title="Editar inquilino"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    )
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => !pending && setOpen(false)} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="my-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Editar inquilino</h2>
              <p className="text-xs text-slate-400 mt-0.5">Local {tenant.units} · {tenant.nombre}</p>
            </div>
            <button onClick={() => setOpen(false)} disabled={pending}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          {confirming ? (
            <div className="px-6 py-6">
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800">¿Confirmar cambios?</p>
                  <ul className="mt-1 space-y-0.5 text-sm text-amber-700 list-disc list-inside">
                    <li>Nombre: <strong>{nombre}</strong></li>
                    {!multiUnit && unitNumber !== tenant.units && <li>Local: <strong>{unitNumber}</strong></li>}
                    {email !== (tenant.portalEmail ?? "") && <li>Email: <strong>{email || "—"}</strong></li>}
                    {hasContract && canonBase !== String(tenant.canonBase ?? "") && (
                      <li>Canon: <strong>$ {parseFloat(canonBase).toLocaleString("es-CO")}</strong></li>
                    )}
                    {hasContract && descuentoPct !== String(tenant.descuentoPct ?? "") && (
                      <li>Descuento fase: <strong>{descuentoPct || "0"}%</strong></li>
                    )}
                    {hasContract && prontoPagoPct !== String(tenant.prontoPagoPct ?? "") && (
                      <li>Pronto pago: <strong>{prontoPagoPct || "0"}%</strong></li>
                    )}
                  </ul>
                </div>
              </div>
              {error && <p className="mb-3 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => setConfirming(false)} disabled={pending}
                  className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                  Cancelar
                </button>
                <button onClick={handleConfirm} disabled={pending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50">
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {pending ? "Guardando…" : "Confirmar"}
                </button>
              </div>
            </div>
          ) : (
            <div className="px-6 py-5 space-y-5">
              {error && <p className="rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p>}

              {/* ── Identity ── */}
              <div className="space-y-3">
                <Field label="Nombre">
                  <TextInput value={nombre} onChange={setNombre} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={multiUnit ? "Locales (múltiples)" : "Local"}>
                    <TextInput value={unitNumber} onChange={setUnitNumber} disabled={multiUnit}
                      placeholder={multiUnit ? "Editar en Clientes" : ""} />
                  </Field>
                  <Field label="Email portal (login)">
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="Sin email"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </Field>
                </div>
              </div>

              {/* ── Contract section (collapsible) ── */}
              {hasContract ? (
                <div className="rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setContractOpen(v => !v)}
                    className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl"
                  >
                    <span>Contrato & Precios</span>
                    {contractOpen
                      ? <ChevronUp className="h-4 w-4 text-slate-400" />
                      : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </button>

                  {contractOpen && (
                    <div className="border-t border-slate-100 px-4 py-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Canon base (COP)">
                          <input type="number" value={canonBase} onChange={e => setCanonBase(e.target.value)}
                            min={0} step={1000}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </Field>
                        <Field label="Descuento fase (%)">
                          <input type="number" value={descuentoPct} onChange={e => setDescuentoPct(e.target.value)}
                            min={0} max={100} step={1} placeholder="0"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </Field>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Pronto pago (%)">
                          <input type="number" value={prontoPagoPct} onChange={e => setProntoPagoPct(e.target.value)}
                            min={0} max={100} step={1} placeholder="0"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </Field>
                        <div /> {/* spacer */}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Inicio contrato">
                          <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </Field>
                        <Field label="Fin contrato">
                          <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)}
                            placeholder="Indefinido"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </Field>
                      </div>
                      <Field label="Notas de descuento">
                        <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
                          rows={2} placeholder="Ej: 43% hasta dic 2025…"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                      </Field>
                    </div>
                  )}
                </div>
              ) : multiUnit ? (
                <p className="rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-500 border border-slate-200">
                  Este inquilino tiene múltiples locales — edite los contratos individualmente en la sección <strong>Clientes</strong>.
                </p>
              ) : null}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                  Cancelar
                </button>
                <button onClick={handleSaveClick}
                  className="flex-1 rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">
                  Guardar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
