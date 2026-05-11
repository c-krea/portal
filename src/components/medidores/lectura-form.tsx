"use client"

import { useActionState, useState } from "react"
import { registrarLectura, type MedidorState } from "@/app/(app)/medidores/actions"
import type { UnitWithMeter } from "@/lib/data/medidores"

const initial: MedidorState = {}

const MES: Record<string, string> = {
  "01": "Enero", "02": "Febrero", "03": "Marzo", "04": "Abril",
  "05": "Mayo",  "06": "Junio",   "07": "Julio", "08": "Agosto",
  "09": "Septiembre", "10": "Octubre", "11": "Noviembre", "12": "Diciembre",
}

function lastThreeMonths(): Array<{ value: string; label: string }> {
  const result = []
  const now = new Date()
  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    result.push({ value: `${y}-${m}`, label: `${MES[m]} ${y}` })
  }
  return result
}

const MONTHS = lastThreeMonths()

function prevPeriodo(p: string): string {
  const [y, m] = p.split("-").map(Number)
  const d = new Date(y, m - 2)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export function LecturaForm({ units, periodo }: { units: UnitWithMeter[]; periodo: string }) {
  const [state, action, pending] = useActionState(registrarLectura, initial)
  const [selectedId, setSelectedId]         = useState("")
  const [selectedPeriodo, setSelectedPeriodo] = useState(
    MONTHS.find((m) => m.value === periodo)?.value ?? MONTHS[0].value
  )

  const selectedUnit    = units.find((u) => u.unitId === selectedId) ?? null
  const calPriorPeriodo = prevPeriodo(selectedPeriodo)

  // Use calendar-prior month if it has a reading; otherwise fall back to the most recent reading
  // before the selected period (e.g. April 2026 was skipped → fall back to March 2026).
  const lecturaAnteriorPeriodo = (() => {
    if (!selectedUnit) return calPriorPeriodo
    if (selectedUnit.readingsByPeriodo[calPriorPeriodo] != null) return calPriorPeriodo
    const earlier = Object.keys(selectedUnit.readingsByPeriodo)
      .filter((p) => p < selectedPeriodo)
      .sort()
      .reverse()
    return earlier[0] ?? calPriorPeriodo
  })()
  const lecturaAnterior = selectedUnit?.readingsByPeriodo[lecturaAnteriorPeriodo] ?? null
  const alreadyExists   = selectedUnit?.existingPeriodos.includes(selectedPeriodo) ?? false

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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Local</label>
          <select
            name="unitId"
            required
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar…</option>
            {units.map((u) => (
              <option key={u.unitId} value={u.unitId}>
                {u.unitNumber}{u.tenantName ? ` — ${u.tenantName}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Período</label>
          <select
            name="periodo"
            required
            value={selectedPeriodo}
            onChange={(e) => setSelectedPeriodo(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Locked state — reading already exists */}
      {alreadyExists && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Ya existe una lectura para este local en {MONTHS.find(m => m.value === selectedPeriodo)?.label}. No se puede modificar.
        </div>
      )}

      {!alreadyExists && (
        <>
          {/* Previous reading — auto-filled */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Lectura anterior
              <span className="ml-1.5 font-normal text-slate-400">({lecturaAnteriorPeriodo})</span>
            </label>
            <input
              type="number"
              value={lecturaAnterior ?? ""}
              readOnly
              placeholder={selectedId ? "Sin lectura registrada" : "Selecciona un local primero"}
              className="w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
            />
            <input type="hidden" name="lecturaAnterior" value={lecturaAnterior ?? 0} />
          </div>

          {/* Current reading — only field admin types */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Lectura actual</label>
            <input
              type="number"
              name="lecturaActual"
              min={lecturaAnterior ?? 0}
              step="1"
              required
              placeholder="Ingresa la lectura del contador"
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
            disabled={pending || !selectedId}
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {pending ? "Guardando…" : "Registrar lectura"}
          </button>
        </>
      )}
    </form>
  )
}
