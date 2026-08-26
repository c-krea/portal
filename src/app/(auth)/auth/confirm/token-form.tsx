"use client"

import { useActionState } from "react"
import { Loader2 } from "lucide-react"
import { confirmRecovery, type ConfirmRecoveryState } from "./actions"

const initial: ConfirmRecoveryState = {}

export function TokenConfirmForm({
  tokenHash,
  type,
}: {
  tokenHash: string
  type: string
}) {
  const [state, action, pending] = useActionState(confirmRecovery, initial)

  if (state.error) {
    return (
      <>
        <p className="mb-5 text-center text-sm text-rose-400">{state.error}</p>
        <a
          href="/forgot-password"
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-medium text-white transition hover:bg-blue-500"
        >
          Solicitar nuevo enlace
        </a>
      </>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token_hash" value={tokenHash} />
      <input type="hidden" name="type" value={type} />
      <p className="text-center text-sm text-slate-300">
        El enlace es válido. Haz clic para continuar y elegir tu nueva contraseña.
      </p>
      <button
        type="submit"
        disabled={pending}
        className="flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Verificando...
          </>
        ) : (
          "Continuar"
        )}
      </button>
    </form>
  )
}
