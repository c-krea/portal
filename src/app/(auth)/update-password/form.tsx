"use client"

import { useState } from "react"
import { useActionState } from "react"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { updatePassword, type UpdatePasswordState } from "./actions"

const initial: UpdatePasswordState = {}

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, initial)
  const [show, setShow]            = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">
          Nueva contraseña
        </label>
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            name="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 pr-10 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-200"
            tabIndex={-1}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">
          Confirmar contraseña
        </label>
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            name="confirm"
            required
            autoComplete="new-password"
            placeholder="Repite la contraseña"
            className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 pr-10 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-200"
            tabIndex={-1}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {state.error && (
        <p className="rounded-lg bg-rose-900/40 px-3 py-2 text-xs text-rose-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Guardando...
          </>
        ) : (
          "Guardar contraseña"
        )}
      </button>
    </form>
  )
}
