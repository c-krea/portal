"use client"

import { useActionState } from "react"
import { calcularIntereses, type AccrualState } from "@/app/(app)/mora/actions"
import { formatCOP } from "@/lib/formatters"

const initial: AccrualState = {}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function AccrualForm() {
  const [state, action, pending] = useActionState(calcularIntereses, initial)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-1 text-sm font-semibold text-slate-800">Calcular Intereses de Mora</h2>
      <p className="mb-4 text-xs text-slate-400">
        Acumula 0.05%/día sobre saldo vencido (Regla C). Idempotente — seguro repetir por fecha.
      </p>

      <form action={action} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Fecha de cálculo
          </label>
          <input
            type="date"
            name="accrualDate"
            defaultValue={todayISO()}
            required
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-rose-600 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
        >
          {pending ? "Calculando…" : "Ejecutar Acumulación"}
        </button>
      </form>

      {state.error && (
        <div className="mt-3 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </div>
      )}

      {state.success && state.summary && (
        <div className="mt-3 space-y-2">
          <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {state.summary.processed} factura{state.summary.processed !== 1 ? "s" : ""} procesada{state.summary.processed !== 1 ? "s" : ""}.
            {state.summary.skipped > 0 && (
              <> {state.summary.skipped} ya tenían acumulación para esta fecha.</>
            )}
          </div>

          {state.summary.totalInterest > 0 && (
            <div className="rounded-lg border border-slate-200 p-3 text-xs">
              <p className="font-semibold text-slate-700">
                Total interés generado: {formatCOP(state.summary.totalInterest)}
              </p>
              <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                {state.summary.results.map((r) => (
                  <div key={r.invoiceId} className="flex justify-between text-slate-500">
                    <span className="font-mono">{r.unitNumber}</span>
                    <span>{r.periodo}</span>
                    <span>{r.daysOverdue}d</span>
                    <span className="text-rose-600">{formatCOP(r.interestAmount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {state.summary.errors.length > 0 && (
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {state.summary.errors.map((e, i) => <p key={i}>{e}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
