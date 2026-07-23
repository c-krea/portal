"use client"

import { useState, useTransition } from "react"
import { Pencil, X, Loader2, AlertTriangle, Mail, Phone } from "lucide-react"
import { updateTenantInquilino } from "./actions"
import type { PortalTenantRow } from "@/lib/data/usuarios"

function EditRow({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
      <Icon className="h-4 w-4 shrink-0 text-slate-300" />
      <span className="w-32 shrink-0 text-xs text-slate-400">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  )
}

function TInput({ value, onChange, placeholder, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder ?? "—"}
      className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
  )
}

export function EditTenantModal({ tenant }: { tenant: PortalTenantRow }) {
  const [open, setOpen]             = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [pending, startTransition]  = useTransition()
  const [error, setError]           = useState<string | null>(null)

  const [telefono, setTelefono] = useState(tenant.telefono ?? "")
  const [email, setEmail]       = useState(tenant.portalEmail ?? tenant.businessEmail ?? "")

  function openModal() {
    setTelefono(tenant.telefono ?? "")
    setEmail(tenant.portalEmail ?? tenant.businessEmail ?? "")
    setError(null); setConfirming(false); setOpen(true)
  }

  function handleSaveClick() {
    setError(null)
    if (email && !email.includes("@")) { setError("Email inválido"); return }
    setConfirming(true)
  }

  async function handleConfirm() {
    startTransition(async () => {
      const res = await updateTenantInquilino(tenant.tenantId, {
        telefono, email,
      })
      if ("error" in res) { setError(res.error); setConfirming(false); return }
      setOpen(false)
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

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-xl">

          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">{tenant.razonSocial}</h2>
              <p className="text-xs text-slate-400 mt-0.5">Local {tenant.units}</p>
            </div>
            <button onClick={() => setOpen(false)} disabled={pending}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </button>
          </div>

          {confirming ? (
            <div className="px-6 py-5">
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
                <p className="text-xs font-semibold text-amber-800">
                  ¿Confirmar cambios de contacto para {tenant.razonSocial}?
                </p>
              </div>
              {error && <p className="mb-3 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => setConfirming(false)} disabled={pending}
                  className="flex-1 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                  Cancelar
                </button>
                <button onClick={handleConfirm} disabled={pending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50">
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {pending ? "Guardando…" : "Confirmar"}
                </button>
              </div>
            </div>
          ) : (
            <div className="px-6 py-5">
              {error && <p className="mb-4 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p>}

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <EditRow icon={Mail} label="Email">
                  <TInput type="email" value={email} onChange={setEmail} placeholder="empresa@email.com" />
                </EditRow>
                <EditRow icon={Phone} label="Teléfono">
                  <TInput value={telefono} onChange={setTelefono} placeholder="310 000 0000" />
                </EditRow>
              </div>

              <div className="mt-5 flex gap-3">
                <button onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">
                  Cancelar
                </button>
                <button onClick={handleSaveClick}
                  className="flex-1 rounded-lg bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-700">
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
