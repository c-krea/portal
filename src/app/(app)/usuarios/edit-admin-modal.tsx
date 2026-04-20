"use client"

import { useState, useTransition } from "react"
import { Pencil, X, Loader2, AlertTriangle } from "lucide-react"
import { updateAdminUser } from "./actions"
import type { UsuarioRow } from "@/lib/data/usuarios"

const ROLES = [
  { value: "admin",   label: "Admin" },
  { value: "finance", label: "Finanzas" },
  { value: "viewer",  label: "Consulta" },
]

export function EditAdminModal({ user }: { user: UsuarioRow }) {
  const [open, setOpen]           = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [fullName, setFullName]   = useState(user.fullName)
  const [email, setEmail]         = useState(user.email)
  const [role, setRole]           = useState(user.role)
  const [error, setError]         = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function openModal() {
    setFullName(user.fullName)
    setEmail(user.email)
    setRole(user.role)
    setError(null)
    setConfirming(false)
    setOpen(true)
  }

  function handleSaveClick() {
    setError(null)
    if (!email.includes("@")) { setError("Email inválido"); return }
    if (!fullName.trim()) { setError("El nombre es obligatorio"); return }
    setConfirming(true)
  }

  function handleConfirm() {
    startTransition(async () => {
      const result = await updateAdminUser(user.id, { fullName, email, role })
      if (result.error) {
        setError(result.error)
        setConfirming(false)
      } else {
        setOpen(false)
        setConfirming(false)
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={openModal}
        className="rounded p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        title="Editar usuario"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={() => !pending && setOpen(false)}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">
              Editar usuario
            </h2>
            <button
              onClick={() => setOpen(false)}
              disabled={pending}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form or Confirmation */}
          {confirming ? (
            <div className="px-6 py-6">
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800">¿Confirmar cambios?</p>
                  <p className="mt-1 text-sm text-amber-700">
                    Se actualizará el perfil y el acceso de autenticación de{" "}
                    <strong>{fullName}</strong>.
                    {email !== user.email && (
                      <> El nuevo email de acceso será <strong>{email}</strong>.</>
                    )}
                  </p>
                </div>
              </div>
              {error && (
                <p className="mb-3 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirming(false)}
                  disabled={pending}
                  className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={pending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                >
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {pending ? "Guardando…" : "Confirmar"}
                </button>
              </div>
            </div>
          ) : (
            <div className="px-6 py-5 space-y-4">
              {error && (
                <p className="rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nombre completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email de acceso</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Rol</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveClick}
                  className="flex-1 rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
                >
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
