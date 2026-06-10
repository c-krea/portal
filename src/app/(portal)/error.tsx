"use client"

import { useEffect } from "react"
import * as Sentry from "@sentry/nextjs"
import { TriangleAlert } from "lucide-react"

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
    console.error(error)
  }, [error])

  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
      <TriangleAlert className="mx-auto h-10 w-10 text-rose-400 mb-3" />
      <p className="font-semibold text-rose-800">Algo salió mal</p>
      <p className="mt-1 text-sm text-rose-600">
        No se pudo completar la acción. Revise su conexión e inténtelo de nuevo.
        Si el problema continúa, comuníquese con la administración.
      </p>
      {error.digest && (
        <p className="mt-1 text-xs text-rose-400">Ref: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 transition-colors"
      >
        Reintentar
      </button>
    </div>
  )
}
