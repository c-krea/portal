"use client"

import { useEffect, useState } from "react"
import { WifiOff } from "lucide-react"

export function OfflineDetector() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    // Check on mount
    if (!navigator.onLine) setOffline(true)

    const goOffline = () => setOffline(true)
    const goOnline = () => setOffline(false)

    window.addEventListener("offline", goOffline)
    window.addEventListener("online", goOnline)
    return () => {
      window.removeEventListener("offline", goOffline)
      window.removeEventListener("online", goOnline)
    }
  }, [])

  if (!offline) return null

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-slate-900 text-white">
      <WifiOff className="h-12 w-12 text-slate-400" />
      <h1 className="text-xl font-semibold">Sin conexión a internet</h1>
      <p className="max-w-xs text-center text-sm text-slate-400">
        Los datos de pago requieren conexión en tiempo real. Revisa tu red e intenta de nuevo.
      </p>
    </div>
  )
}
