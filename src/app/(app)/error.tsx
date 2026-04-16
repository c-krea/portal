"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <div className="rounded-full bg-rose-50 p-3">
          <AlertTriangle className="h-6 w-6 text-rose-500" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">Error al cargar</h2>
          <p className="mt-1 text-sm text-slate-500">
            Ocurrió un problema al cargar esta página. Intenta de nuevo.
          </p>
          {error.digest && (
            <p className="mt-1 text-xs text-slate-400">Ref: {error.digest}</p>
          )}
        </div>
        <button
          onClick={reset}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  )
}
