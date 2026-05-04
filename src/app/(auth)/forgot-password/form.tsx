"use client"

import { useActionState } from "react"
import Link from "next/link"
import { Loader2, CheckCircle2 } from "lucide-react"
import { requestPasswordReset, type ForgotPasswordState } from "./actions"

const initial: ForgotPasswordState = {}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initial)

  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-400" />
        <p className="text-sm text-slate-300">
          Si ese email tiene una cuenta, recibirás un enlace para restablecer tu contraseña.
          Revisa tu bandeja de entrada.
        </p>
        <Link
          href="/login"
          className="text-sm text-blue-400 hover:text-blue-300 underline"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">
          Email
        </label>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="nombre@empresa.com"
          className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
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
            Enviando...
          </>
        ) : (
          "Enviar enlace"
        )}
      </button>

      <Link
        href="/login"
        className="text-center text-xs text-slate-400 hover:text-slate-300"
      >
        Volver al inicio de sesión
      </Link>
    </form>
  )
}
