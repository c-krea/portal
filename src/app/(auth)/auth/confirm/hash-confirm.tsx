"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { AuthCard } from "./auth-card"

/** Legacy path: old emails still land here with #access_token from the Supabase verify URL. */
export function HashConfirm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const hash = window.location.hash
    const params = new URLSearchParams(hash.slice(1))

    const errorCode = params.get("error_code") || params.get("error")
    if (errorCode) {
      setError(
        "El enlace expiró o ya fue usado. Por seguridad cada enlace funciona una sola vez. Solicita uno nuevo abajo.",
      )
      return
    }

    const access_token = params.get("access_token")
    const refresh_token = params.get("refresh_token")
    const type = params.get("type")

    if (!access_token || !refresh_token) {
      setError("Este enlace no es válido. Solicita uno nuevo para continuar.")
      return
    }

    const supabase = createClient()
    supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
      if (error) {
        setError("El enlace expiró o ya fue usado. Solicita uno nuevo.")
        return
      }
      if (type === "recovery") {
        router.replace("/update-password")
      } else {
        router.replace("/")
      }
    })
  }, [router])

  if (error) {
    return (
      <AuthCard>
        <p className="mb-5 text-center text-sm text-rose-400">{error}</p>
        <a
          href="/forgot-password"
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-medium text-white transition hover:bg-blue-500"
        >
          Solicitar nuevo enlace
        </a>
      </AuthCard>
    )
  }

  return (
    <AuthCard>
      <div className="flex flex-col items-center gap-3 py-2">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        <p className="text-sm text-slate-400">Verificando enlace...</p>
      </div>
    </AuthCard>
  )
}
