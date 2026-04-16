"use client"

import { useActionState } from "react"
import { registrarLectura, type MedidorState } from "@/app/(app)/medidores/actions"
import type { UnitWithMeter } from "@/lib/data/medidores"

const initial: MedidorState = {}

const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
]

function defaultPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

export function LecturaForm({ units }: { units: UnitWithMeter[] }) {
  const [state, action, pending] = useActionState(registrarLectura, initial)

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.message}
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Local</label>
        <select
          name="unitId"
          required
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Seleccionar local…</option>
          {units.map((u) => (
            <option key={u.unitId} value={u.unitId}>
              {u.unitNumber} {u.tenantName ? `— ${u.tenantName}` : "(sin inquilino)"}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Período</label>
        <input
          type="month"
          name="periodo"
          defaultValue={defaultPeriod()}
          required
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Lectura anterior (kWh)</label>
          <input
            type="number"
            name="lecturaAnterior"
            defaultValue="0"
            min="0"
            step="0.01"
            required
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Lectura actual (kWh)</label>
          <input
            type="number"
            name="lecturaActual"
            min="0"
            step="0.01"
            required
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Tarifa kWh (COP)</label>
        <input
          type="number"
          name="tarifaKwh"
          placeholder="Ej: 850"
          min="1"
          step="0.01"
          required
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Notas (opcional)</label>
        <input
          type="text"
          name="notas"
          placeholder="Observaciones…"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Registrar lectura"}
      </button>
    </form>
  )
}
