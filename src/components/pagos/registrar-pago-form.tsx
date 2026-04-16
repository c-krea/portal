"use client"

import { useActionState, useRef } from "react"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { registrarPago, type ActionState } from "@/app/(app)/pagos/actions"
import type { TenantOption } from "@/lib/data/pagos"

const initial: ActionState = {}

export function RegistrarPagoForm({ tenants }: { tenants: TenantOption[] }) {
  const [state, action, pending] = useActionState(registrarPago, initial)
  const formRef = useRef<HTMLFormElement>(null)

  // Reset form on success
  if (state.success && formRef.current) {
    formRef.current.reset()
  }

  return (
    <form ref={formRef} action={action} className="space-y-4">
      {/* Tenant */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Cliente <span className="text-rose-500">*</span>
        </label>
        <select
          name="tenantId"
          required
          defaultValue=""
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="" disabled>
            Seleccionar cliente...
          </option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Fecha de Recaudo <span className="text-rose-500">*</span>
        </label>
        <input
          type="date"
          name="fechaRecaudo"
          required
          defaultValue={new Date().toISOString().split("T")[0]}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Amount */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Monto (COP) <span className="text-rose-500">*</span>
        </label>
        <input
          type="number"
          name="valorAplicado"
          required
          min={1}
          step={1}
          placeholder="0"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Concepto */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Concepto
        </label>
        <input
          type="text"
          name="concepto"
          placeholder="Ej: Canon enero 2026"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Notas
        </label>
        <textarea
          name="notes"
          rows={2}
          placeholder="Observaciones opcionales..."
          className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Feedback */}
      {state.error && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {state.message}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-60"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {pending ? "Registrando..." : "Registrar Pago"}
      </button>
    </form>
  )
}
