"use client"

import { useState, useTransition } from "react"
import {
  Pencil, X, Loader2, AlertTriangle,
  Hash, Briefcase, User, Mail, Phone, MapPin, Store,
  CalendarDays, TrendingUp, Percent, ArrowRight, KeyRound,
} from "lucide-react"
import { updateTenantUser } from "./actions"
import type { PortalTenantRow } from "@/lib/data/usuarios"

function SectionTitle({ title }: { title: string }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
  )
}

function EditRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
      <Icon className="h-4 w-4 shrink-0 text-slate-300" />
      <span className="w-32 shrink-0 text-xs text-slate-400">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  )
}

function TInput({
  value, onChange, placeholder, type = "text", disabled,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder ?? "—"}
      disabled={disabled}
      className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
    />
  )
}

export function EditTenantModal({ tenant }: { tenant: PortalTenantRow }) {
  const multiUnit = tenant.unitIds.length > 1
  const hasContract = !!tenant.contractId && !multiUnit

  const [open, setOpen]             = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [pending, startTransition]  = useTransition()
  const [error, setError]           = useState<string | null>(null)

  // Contact fields
  const [nombre, setNombre]                 = useState(tenant.nombre)
  const [razonSocial, setRazonSocial]       = useState(tenant.razonSocial)
  const [nit, setNit]                       = useState(tenant.nit ?? "")
  const [telefono, setTelefono]             = useState(tenant.telefono ?? "")
  const [contactoNombre, setContactoNombre] = useState(tenant.contactoNombre ?? "")
  const [bizEmail, setBizEmail]             = useState(tenant.businessEmail ?? "")
  const [portalEmail, setPortalEmail]       = useState(tenant.portalEmail ?? "")
  const [unitNumber, setUnitNumber]         = useState(tenant.units)
  const [entrada, setEntrada]               = useState(tenant.entrada ?? "")

  // Contract fields
  const [canonBase, setCanonBase]           = useState(String(tenant.canonBase ?? ""))
  const [descuentoPct, setDescuentoPct]     = useState(String(tenant.descuentoPct ?? ""))
  const [prontoPagoPct, setProntoPagoPct]   = useState(String(tenant.prontoPagoPct ?? ""))
  const [fechaInicio, setFechaInicio]       = useState(tenant.fechaInicio ?? "")
  const [fechaFin, setFechaFin]             = useState(tenant.fechaFin ?? "")
  const [descripcion, setDescripcion]       = useState(tenant.descripcionDescuentos ?? "")

  function openModal() {
    setNombre(tenant.nombre); setRazonSocial(tenant.razonSocial)
    setNit(tenant.nit ?? ""); setTelefono(tenant.telefono ?? "")
    setContactoNombre(tenant.contactoNombre ?? ""); setBizEmail(tenant.businessEmail ?? "")
    setPortalEmail(tenant.portalEmail ?? ""); setUnitNumber(tenant.units)
    setEntrada(tenant.entrada ?? "")
    setCanonBase(String(tenant.canonBase ?? "")); setDescuentoPct(String(tenant.descuentoPct ?? ""))
    setProntoPagoPct(String(tenant.prontoPagoPct ?? ""))
    setFechaInicio(tenant.fechaInicio ?? ""); setFechaFin(tenant.fechaFin ?? "")
    setDescripcion(tenant.descripcionDescuentos ?? "")
    setError(null); setConfirming(false); setOpen(true)
  }

  function handleSaveClick() {
    setError(null)
    if (!razonSocial.trim()) { setError("La razón social es obligatoria"); return }
    if (portalEmail && !portalEmail.includes("@")) { setError("Email portal inválido"); return }
    if (bizEmail && !bizEmail.includes("@")) { setError("Email de contacto inválido"); return }
    if (hasContract && canonBase && isNaN(parseFloat(canonBase))) { setError("Canon base inválido"); return }
    setConfirming(true)
  }

  function handleConfirm() {
    startTransition(async () => {
      const result = await updateTenantUser(tenant.tenantId, tenant.unitIds, {
        nombre, razonSocial, nit, telefono, contactoNombre,
        portalEmail, businessEmail: bizEmail, unitNumber, entrada,
        ...(hasContract && {
          contractId:           tenant.contractId!,
          canonBase:            parseFloat(canonBase) || undefined,
          descuentoPct:         descuentoPct ? parseFloat(descuentoPct) : null,
          prontoPagoPct:        prontoPagoPct ? parseFloat(prontoPagoPct) : null,
          fechaInicio:          fechaInicio || undefined,
          fechaFin:             fechaFin || null,
          descripcionDescuentos: descripcion || null,
        }),
      })
      if (result.error) { setError(result.error); setConfirming(false) }
      else { setOpen(false) }
    })
  }

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
                    {hasContract && ", condiciones del contrato"}
                    {portalEmail !== (tenant.portalEmail ?? "") && " y acceso al portal"}
                    .
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

                {/* ── Left: Contact card ── */}
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
                  <EditRow icon={MapPin} label="Entrada">
                    <TInput value={entrada} onChange={setEntrada}
                      placeholder={multiUnit ? "Múltiples locales" : "Ej: Entrada Norte"}
                      disabled={multiUnit} />
                  </EditRow>
                  <EditRow icon={Store} label="Local">
                    <TInput value={unitNumber} onChange={setUnitNumber}
                      disabled={multiUnit}
                      placeholder={multiUnit ? "Editar en Clientes" : ""} />
                  </EditRow>
                  <EditRow icon={KeyRound} label="Email portal">
                    <TInput type="email" value={portalEmail} onChange={setPortalEmail} placeholder="Login al portal" />
                  </EditRow>
                </div>

                {/* ── Right: Contract card ── */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <SectionTitle title="Condiciones del Contrato" />

                  {!hasContract ? (
                    <p className="text-xs text-slate-400 italic">
                      {multiUnit
                        ? "Múltiples contratos — edite individualmente en Clientes."
                        : "Sin contrato activo."}
                    </p>
                  ) : (
                    <>
                      <EditRow icon={CalendarDays} label="Inicio">
                        <TInput type="date" value={fechaInicio} onChange={setFechaInicio} />
                      </EditRow>
                      <EditRow icon={ArrowRight} label="Fin">
                        <TInput type="date" value={fechaFin} onChange={setFechaFin} placeholder="Indefinido" />
                      </EditRow>
                      <EditRow icon={TrendingUp} label="Canon base">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                          <input
                            type="number" value={canonBase}
                            onChange={e => setCanonBase(e.target.value)}
                            min={0} step={1000}
                            className="w-full rounded-md border border-slate-200 pl-5 pr-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </EditRow>
                      <EditRow icon={Percent} label="Descuento fase">
                        <div className="relative">
                          <input type="number" value={descuentoPct}
                            onChange={e => setDescuentoPct(e.target.value)}
                            min={0} max={100} step={1} placeholder="0"
                            className="w-full rounded-md border border-slate-200 px-2 pr-6 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                        </div>
                      </EditRow>
                      <EditRow icon={Percent} label="Pronto pago">
                        <div className="relative">
                          <input type="number" value={prontoPagoPct}
                            onChange={e => setProntoPagoPct(e.target.value)}
                            min={0} max={100} step={1} placeholder="0"
                            className="w-full rounded-md border border-slate-200 px-2 pr-6 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                        </div>
                      </EditRow>
                      <div className="pt-2">
                        <p className="mb-1 text-xs text-slate-400">Notas de descuento</p>
                        <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
                          rows={3} placeholder="Ej: 43% hasta dic 2025…"
                          className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Footer */}
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
