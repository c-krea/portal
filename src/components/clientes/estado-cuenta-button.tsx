"use client"

import { useState } from "react"
import { FileDown, Loader2 } from "lucide-react"
import { getEstadoCuenta } from "@/app/(app)/locales/estado-cuenta-actions"
import { cn } from "@/lib/utils"

function slug(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 60)
}

/**
 * Downloads the tenant's "Estado de Cuenta" PDF. Data is fetched and the PDF
 * rendered only on click (react-pdf is loaded lazily), so the button is cheap
 * to put on every row of a table.
 */
export function EstadoCuentaButton({ tenantId, className }: { tenantId: string; className?: string }) {
  const [pending, setPending] = useState(false)

  async function download(e: React.MouseEvent) {
    // Rows of the Locales table navigate on click.
    e.stopPropagation()
    e.preventDefault()
    if (pending) return
    setPending(true)
    try {
      const res = await getEstadoCuenta(tenantId)
      if ("error" in res) {
        alert(res.error)
        return
      }
      const [{ pdf }, { EstadoCuentaPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/lib/pdf/estado-cuenta"),
      ])
      const origin = window.location.origin
      const blob = await pdf(
        <EstadoCuentaPDF
          data={res.data}
          logoSrc={`${origin}/logo-estado-cuenta.png`}
          bottomLogoSrc={`${origin}/logo-reymon.png`}
        />,
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Estado_de_cuenta_${slug(res.data.nombre)}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) {
      console.error(err)
      alert("No se pudo generar el estado de cuenta. Intente de nuevo.")
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={pending}
      title="Descargar estado de cuenta (PDF)"
      aria-label="Descargar estado de cuenta (PDF)"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-600 disabled:opacity-60",
        className,
      )}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
    </button>
  )
}
