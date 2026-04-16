"use client"

import { useActionState } from "react"
import { generarFacturas, type GenerateState } from "@/app/(app)/facturas/actions"
import { Loader2, FileText, AlertCircle, CheckCircle2 } from "lucide-react"

const MONTH_LABELS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

const initial: GenerateState = {}

export function GenerateForm() {
  const [state, action, pending] = useActionState(generarFacturas, initial)
  const currentYear = new Date().getFullYear()

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600">
            Mes
          </label>
          <select
            name="month"
            defaultValue={new Date().getMonth() + 1}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {MONTH_LABELS.map((label, i) => (
              <option key={i + 1} value={i + 1}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600">
            Año
          </label>
          <select
            name="year"
            defaultValue={currentYear}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {state.error && (
        <div className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2.5">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          <p className="text-xs text-rose-700">{state.error}</p>
        </div>
      )}

      {state.success && (
        <div className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2.5">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
          <div>
            <p className="text-xs text-emerald-700">{state.message}</p>
            {state.errors && state.errors.length > 0 && (
              <div className="mt-1.5">
                <p className="text-xs font-medium text-amber-700">
                  {state.errors.length} error{state.errors.length > 1 ? "es" : ""}:
                </p>
                <ul className="mt-1 space-y-0.5">
                  {state.errors.map((e, i) => (
                    <li key={i} className="text-xs text-amber-600">{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generando...
          </>
        ) : (
          <>
            <FileText className="h-4 w-4" />
            Generar Facturas
          </>
        )}
      </button>

      <p className="text-xs text-slate-400">
        Genera facturas en borrador para todos los contratos activos del período.
        Las facturas existentes serán omitidas.
      </p>
    </form>
  )
}
