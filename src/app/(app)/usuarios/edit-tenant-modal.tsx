"use client"

import { useState, useTransition } from "react"
import {
  Pencil, X, Loader2, AlertTriangle,
  Hash, Briefcase, User, Mail, Phone, MapPin, Store,
  CalendarDays, TrendingUp, Percent, ArrowRight, KeyRound,
} from "lucide-react"
import { updateTenantUser } from "./actions"
import type { PortalTenantRow, UnitContract } from "@/lib/data/usuarios"

function SectionTitle({ title }: { title: string }) {
  return <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
}

function EditRow({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
      <Icon className="h-4 w-4 shrink-0 text-slate-300" />
      <span className="w-32 shrink-0 text-xs text-slate-400">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  )
}

function TInput({ value, onChange, placeholder, type = "text", disabled }: {
  value: string; onChange?: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean
}) {
  return (
    <input type={type} value={value} onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder ?? "—"} disabled={disabled}
      className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400" />
  )
}

function NumInput({ value, onChange, placeholder, min = 0, step = 1 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; min?: number; step?: number
}) {
  return (
    <input type="number" value={value} onChange={e => onChange(e.target.value)}
      min={min} step={step} placeholder={placeholder ?? "0"}
      className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
  )
}

function ContractFields({
  uc, onChange,
}: {
  uc: { canonBase: string; descuentoPct: string; prontoPagoPct: string; fechaInicio: string; fechaFin: string; descripcion: string }
  onChange: (field: string, v: string) => void
}) {
  return (
    <>
      <EditRow icon={CalendarDays} label="Inicio">
        <TInput type="date" value={uc.fechaInicio} onChange={v => onChange("fechaInicio", v)} />
      </EditRow>
      <EditRow icon={ArrowRight} label="Fin">
        <TInput type="date" value={uc.fechaFin} onChange={v => onChange("fechaFin", v)} placeholder="Indefinido" />
      </EditRow>
      <EditRow icon={TrendingUp} label="Canon base">
        <NumInput value={uc.canonBase} onChange={v => onChange("canonBase", v)} step={1000} />
      </EditRow>
      <EditRow icon={Percent} label="Descuento fase">
        <NumInput value={uc.descuentoPct} onChange={v => onChange("descuentoPct", v)} />
      </EditRow>
      <EditRow icon={Percent} label="Pronto pago">
        <NumInput value={uc.prontoPagoPct} onChange={v => onChange("prontoPagoPct", v)} />
      </EditRow>
      <div className="pt-2">
        <p className="mb-1 text-xs text-slate-400">Notas de descuento</p>
        <textarea value={uc.descripcion} onChange={e => onChange("descripcion", e.target.value)}
          rows={3} placeholder="Ej: 43% hasta dic 2025…"
          className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" />
      </div>
    </>
  )
}

type ContractState = {
  canonBase: string; descuentoPct: string; prontoPagoPct: string
  fechaInicio: string; fechaFin: string; descripcion: string
}

function ucToState(uc: UnitContract): ContractState {
  return {
    canonBase:    String(uc.canonBase ?? ""),
    descuentoPct: String(uc.descuentoPct ?? ""),
    prontoPagoPct: String(uc.prontoPagoPct ?? ""),
    fechaInicio:  uc.fechaInicio ?? "",
    fechaFin:     uc.fechaFin ?? "",
    descripcion:  uc.descripcionDescuentos ?? "",
  }
}

export function EditTenantModal({ tenant }: { tenant: PortalTenantRow }) {
  const [open, setOpen]             = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [pending, startTransition]  = useTransition()
  const [error, setError]           = useState<string | null>(null)

  // Identity
  const [nombre, setNombre]                 = useState(tenant.nombre)
  const [razonSocial, setRazonSocial]       = useState(tenant.razonSocial)
  const [nit, setNit]                       = useState(tenant.nit ?? "")
  const [telefono, setTelefono]             = useState(tenant.telefono ?? "")
  const [contactoNombre, setContactoNombre] = useState(tenant.contactoNombre ?? "")
  const [bizEmail, setBizEmail]             = useState(tenant.businessEmail ?? "")
  const [portalEmail, setPortalEmail]       = useState(tenant.portalEmail ?? "")

  // Per-unit contract states (keyed by contractId)
  const [selectedUnitIdx, setSelectedUnitIdx] = useState(0)
  const [contractStates, setContractStates]   = useState<Record<string, ContractState>>({})

  function initStates() {
    const init: Record<string, ContractState> = {}
    for (const uc of tenant.unitContracts) init[uc.contractId] = ucToState(uc)
    return init
  }

  function openModal() {
    setNombre(tenant.nombre); setRazonSocial(tenant.razonSocial)
    setNit(tenant.nit ?? ""); setTelefono(tenant.telefono ?? "")
    setContactoNombre(tenant.contactoNombre ?? ""); setBizEmail(tenant.businessEmail ?? "")
    setPortalEmail(tenant.portalEmail ?? ""); setSelectedUnitIdx(0)
    setContractStates(initStates())
    setError(null); setConfirming(false); setOpen(true)
  }

  function updateContractField(contractId: string, field: string, value: string) {
    setContractStates(prev => ({ ...prev, [contractId]: { ...prev[contractId], [field]: value } }))
  }

  function handleSaveClick() {
    setError(null)
    if (!razonSocial.trim()) { setError("La razón social es obligatoria"); return }
    if (portalEmail && !portalEmail.includes("@")) { setError("Email portal inválido"); return }
    if (bizEmail && !bizEmail.includes("@")) { setError("Email de contacto inválido"); return }
    setConfirming(true)
  }

  async function handleConfirm() {
    startTransition(async () => {
      // Save identity + each contract sequentially
      for (const uc of tenant.unitContracts) {
        const cs = contractStates[uc.contractId]
        const result = await updateTenantUser(tenant.tenantId, [uc.unitId], {
          nombre, razonSocial, nit, telefono, contactoNombre,
          portalEmail, businessEmail: bizEmail,
          unitNumber: uc.unitNumber,
          entrada: uc.entrada ?? "",
          contractId:           uc.contractId,
          canonBase:            parseFloat(cs.canonBase) || undefined,
          descuentoPct:         cs.descuentoPct ? parseFloat(cs.descuentoPct) : null,
          prontoPagoPct:        cs.prontoPagoPct ? parseFloat(cs.prontoPagoPct) : null,
          fechaInicio:          cs.fechaInicio || undefined,
          fechaFin:             cs.fechaFin || null,
          descripcionDescuentos: cs.descripcion || null,
        })
        if (result.error) { setError(result.error); setConfirming(false); return }
      }
      setOpen(false)
    })
  }

  const selectedUc = tenant.unitContracts[selectedUnitIdx]
  const selectedCs = selectedUc ? contractStates[selectedUc.contractId] : null

  if (!open) {
    return (
      <button onClick={openModal}
        className="rounded p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        title="Editar inquilino">
        <Pencil className="h-3.5 w-3.5" />
      </button>
    )
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => !pending && setOpen(false)} />

      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
        <div className="my-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-xl">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">{tenant.nombre}</h2>
              <p className="text-xs text-slate-400 mt-0.5">Local {tenant.units}</p>
            </div>
            <button onClick={() => setOpen(false)} disabled={pending}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </button>
          </div>

          {confirming ? (
            <div className="px-6 py-6">
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800">¿Confirmar cambios para {razonSocial}?</p>
                  <p className="mt-1 text-sm text-amber-700">
                    Se actualizará la información de contacto
                    {tenant.unitContracts.length > 0 && `, y los contratos de los locales ${tenant.units}`}
                    {portalEmail !== (tenant.portalEmail ?? "") && " y acceso al portal"}.
                  </p>
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
            <div className="p-6">
              {error && <p className="mb-4 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p>}

              <div className="grid grid-cols-2 gap-5">

                {/* ── Left: Contact ── */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <SectionTitle title="Información de Contacto" />
                  <EditRow icon={Hash} label="NIT / Cédula">
                    <TInput value={nit} onChange={setNit} placeholder="900123456-1" />
                  </EditRow>
                  <EditRow icon={Briefcase} label="Razón social">
                    <TInput value={razonSocial} onChange={setRazonSocial} />
                  </EditRow>
                  <EditRow icon={Briefcase} label="Nombre corto">
                    <TInput value={nombre} onChange={setNombre} placeholder="Como aparece en el portal" />
                  </EditRow>
                  <EditRow icon={User} label="Representante">
                    <TInput value={contactoNombre} onChange={setContactoNombre} placeholder="Nombre del contacto" />
                  </EditRow>
                  <EditRow icon={Mail} label="Email contacto">
                    <TInput type="email" value={bizEmail} onChange={setBizEmail} placeholder="empresa@email.com" />
                  </EditRow>
                  <EditRow icon={Phone} label="Teléfono">
                    <TInput value={telefono} onChange={setTelefono} placeholder="310 000 0000" />
                  </EditRow>
                  <EditRow icon={Store} label="Local(es)">
                    <TInput value={tenant.units} disabled />
                  </EditRow>
                  <EditRow icon={KeyRound} label="Email portal">
                    <TInput type="email" value={portalEmail} onChange={setPortalEmail} placeholder="Login al portal" />
                  </EditRow>
                </div>

                {/* ── Right: Contract(s) ── */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <SectionTitle title="Condiciones del Contrato" />

                  {tenant.unitContracts.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Sin contrato activo.</p>
                  ) : (
                    <>
                      {/* Unit selector tabs — shown only for multi-unit */}
                      {tenant.unitContracts.length > 1 && (
                        <div className="mb-3 flex gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
                          {tenant.unitContracts.map((uc, idx) => (
                            <button key={uc.contractId}
                              onClick={() => setSelectedUnitIdx(idx)}
                              className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${
                                selectedUnitIdx === idx
                                  ? "bg-white text-slate-900 shadow-sm"
                                  : "text-slate-500 hover:text-slate-700"
                              }`}>
                              Local {uc.unitNumber}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Contract fields for selected unit */}
                      {selectedUc && selectedCs && (
                        <>
                          {selectedUc.entrada && (
                            <EditRow icon={MapPin} label="Entrada">
                              <TInput value={selectedUc.entrada} disabled />
                            </EditRow>
                          )}
                          <ContractFields
                            uc={selectedCs}
                            onChange={(field, v) => updateContractField(selectedUc.contractId, field, v)}
                          />
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <button onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                  Cancelar
                </button>
                <button onClick={handleSaveClick}
                  className="flex-1 rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">
                  Guardar cambios
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
