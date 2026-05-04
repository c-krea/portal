"use client"

import { useState } from "react"
import { useActionState } from "react"
import { signIn, type LoginState } from "@/app/(auth)/login/actions"
import { Loader2, Eye, EyeOff } from "lucide-react"

const initial: LoginState = {}

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, initial)
  const [showPassword, setShowPassword] = useState(false)

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

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">
          Contraseña
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 pr-10 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-200"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="remember_me"
            name="remember_me"
            value="1"
            defaultChecked
            className="h-4 w-4 rounded border-slate-600 bg-slate-700 accent-blue-500"
          />
          <label htmlFor="remember_me" className="text-xs text-slate-400 select-none cursor-pointer">
            Recordarme
          </label>
        </div>
        <a
          href="/forgot-password"
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      {state.error && (
        <p className="rounded-lg bg-rose-900/40 px-3 py-2 text-xs text-rose-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Ingresando...
          </>
        ) : (
          "Ingresar"
        )}
      </button>
    </form>
  )
}
