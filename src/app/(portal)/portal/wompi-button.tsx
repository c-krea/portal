"use client"

import { useState } from "react"
import { CreditCard, X } from "lucide-react"

const WOMPI_URL = "https://checkout.wompi.co/l/CBEaKx"

export function WompiButton({ unitNumber }: { unitNumber: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-4 text-base font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 active:bg-emerald-800"
      >
        <CreditCard className="h-5 w-5" />
        Pagar en línea
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-2">
              <h2 className="text-lg font-bold text-slate-900">Antes de continuar</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-slate-700">
              Al realizar su pago, ingrese el número de su local como referencia:
            </p>
            <p className="mt-3 rounded-lg bg-slate-100 px-4 py-3 text-center text-2xl font-black tracking-widest text-slate-900">
              {unitNumber}
            </p>
            <p className="mt-3 text-sm text-slate-500">
              Esto es necesario para que el pago quede registrado correctamente en su cuenta.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <a
                href={WOMPI_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-emerald-700"
              >
                Ir a pagar
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
