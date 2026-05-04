"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import Image from "next/image"

function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <Image src="/ckrea-logo.png" alt="C-Krea logo" width={200} height={200} className="drop-shadow-lg" />
          <h1 className="mt-4 text-xl font-semibold text-white">C-Krea PayControl</h1>
          <p className="mt-1 text-sm text-slate-400">Central Kreativa — Portal de Pagos</p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-7 shadow-xl">
          {children}
        </div>
      </div>
    </div>
  )
}

export default function AuthConfirmPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const hash = window.location.hash
    if (!hash) {
      router.replace("/login?error=link_invalido")
      return
    }

    const params = new URLSearchParams(hash.slice(1))
    const access_token = params.get("access_token")
    const refresh_token = params.get("refresh_token")
    const type = params.get("type")

    if (!access_token || !refresh_token) {
      router.replace("/login?error=link_invalido")
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
        <p className="text-rose-400 text-sm mb-4 text-center">{error}</p>
        <a
          href="/forgot-password"
          className="block text-center text-sm text-blue-400 hover:text-blue-300"
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
