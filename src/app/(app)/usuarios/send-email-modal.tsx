"use client"

import { useState, useTransition } from "react"
import { Mail, X, Loader2, CheckCircle2, Send, Gift, KeyRound } from "lucide-react"
import { sendSystemEmail } from "./actions"
import type { PortalTenantRow, UsuarioRow } from "@/lib/data/usuarios"

type EmailType = "welcome" | "reset"

const EMAIL_TYPES: { type: EmailType; icon: React.ReactNode; label: string; desc: string }[] = [
  {
    type: "welcome",
    icon: <Gift className="h-4 w-4 text-blue-500" />,
    label: "Bienvenida",
    desc: "Envía el email de bienvenida con enlace para crear contraseña.",
  },
  {
    type: "reset",
    icon: <KeyRound className="h-4 w-4 text-amber-500" />,
    label: "Restablecer contraseña",
    desc: "Envía un enlace para que el usuario cambie su contraseña.",
  },
]

export function SendEmailModal({
  tenants,
  admins,
}: {
  tenants: PortalTenantRow[]
  admins: UsuarioRow[]
}) {
  const [open, setOpen] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState("")
  const [emailType, setEmailType] = useState<EmailType>("welcome")
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [pending, start] = useTransition()

  const tenantRecipients = tenants.filter(t => t.portalEmail)
  const allRecipients = [
    ...tenantRecipients.map(t => ({ email: t.portalEmail!, name: t.nombre, group: "Inquilinos" })),
    ...admins.map(u => ({ email: u.email, name: u.fullName, group: "Administración" })),
  ]
  const selected = allRecipients.find(r => r.email === recipientEmail) ?? null

  function handleOpen() {
    setOpen(true)
    setError(null)
    setSent(false)
    setRecipientEmail("")
    setEmailType("welcome")
  }

  function handleClose() {
    if (pending) return
    setOpen(false)
  }

  function handleSend() {
    if (!selected) { setError("Selecciona un destinatario"); return }
    setError(null)
    start(async () => {
      const res = await sendSystemEmail({
        toEmail: selected.email,
        toName: selected.name,
        type: emailType,
      })
      if (res.error) setError(res.error)
      else setSent(true)
    })
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
      >
        <Mail className="h-4 w-4 text-slate-500" />
        Enviar Email
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-500" />
                <h2 className="text-base font-semibold text-slate-900">Enviar Email</h2>
              </div>
              <button onClick={handleClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            {sent ? (
              <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                <p className="font-medium text-slate-800">Email enviado</p>
                <p className="text-sm text-slate-500">
                  Enviado a <strong>{selected?.email}</strong>
                </p>
                <button
                  onClick={handleClose}
                  className="mt-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <div className="px-6 py-5 flex flex-col gap-5">
                {/* Recipient */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Destinatario</label>
                  <select
                    value={recipientEmail}
                    onChange={e => setRecipientEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                  >
                    <option value="">— Seleccionar —</option>
                    {tenantRecipients.length > 0 && (
                      <optgroup label="Inquilinos">
                        {tenantRecipients.map(t => (
                          <option key={t.tenantId} value={t.portalEmail!}>
                            {t.nombre} ({t.units}) — {t.portalEmail}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="Administración">
                      {admins.map(u => (
                        <option key={u.id} value={u.email}>
                          {u.fullName} — {u.email}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Email type */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-600">Tipo de email</label>
                  <div className="flex flex-col gap-2">
                    {EMAIL_TYPES.map(({ type, icon, label, desc }) => (
                      <button
                        key={type}
                        onClick={() => setEmailType(type)}
                        className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                          emailType === type
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <span className="mt-0.5">{icon}</span>
                        <span>
                          <span className="block text-sm font-semibold text-slate-800">{label}</span>
                          <span className="text-xs text-slate-500">{desc}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleClose}
                    disabled={pending}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={pending || !selected}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {pending
                      ? <><Loader2 className="h-4 w-4 animate-spin" />Enviando...</>
                      : <><Send className="h-4 w-4" />Enviar</>
                    }
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
