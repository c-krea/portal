"use client"

import { useTransition } from "react"
import { emitirFactura } from "@/app/(app)/facturas/actions"

export function EmitButton({ invoiceId }: { invoiceId: string }) {
  const [pending, startTransition] = useTransition()

  function handleEmit() {
    startTransition(async () => {
      const result = await emitirFactura(invoiceId)
      if (result.error) alert(result.error)
    })
  }

  return (
    <button
      onClick={handleEmit}
      disabled={pending}
      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
    >
      {pending ? "Emitiendo…" : "Emitir Factura"}
    </button>
  )
}
