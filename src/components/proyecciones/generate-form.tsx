"use client"

import { useActionState } from "react"
import { generarProyecciones, type GenerateProyeccionesState } from "@/app/(app)/proyecciones/actions"

type Props = {
  defaultYear: number
  defaultIpc: number
}

const initialState: GenerateProyeccionesState = { success: false }

export function GenerateProyeccionesForm({ defaultYear, defaultIpc }: Props) {
  const [state, action, pending] = useActionState(generarProyecciones, initialState)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-slate-800">Generar proyecciones</h2>
      <form action={action} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Año a generar</label>
            <input
              name="year"
              type="number"
              defaultValue={defaultYear}
              min={2025}
              max={2035}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Incremento IPC (%)</label>
            <input
              name="ipcRate"
              type="number"
              step="0.01"
              defaultValue={defaultIpc}
              min={0}
              max={100}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            />
          </div>
        </div>

        <p className="text-xs text-slate-400">
          Canon nuevo = canon diciembre anterior × (1 + IPC%). Sólo contratos activos sin proyecciones para el año seleccionado.
        </p>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {pending ? "Generando..." : "Generar proyecciones"}
        </button>
      </form>

      {/* Results */}
      {state.success && state.created !== undefined && (
        <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm">
          <p className="font-medium text-emerald-800">
            {state.created === 0
              ? "No hay contratos pendientes — todos ya tienen proyecciones para ese año."
              : `✓ ${state.created} contrato${state.created !== 1 ? "s" : ""} generado${state.created !== 1 ? "s" : ""} (12 meses c/u)`}
          </p>
          {state.errors && state.errors.length > 0 && (
            <ul className="mt-2 space-y-0.5 text-xs text-rose-700">
              {state.errors.map((e, i) => <li key={i}>⚠ {e}</li>)}
            </ul>
          )}
        </div>
      )}
      {state.error && (
        <div className="mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{state.error}</div>
      )}
    </div>
  )
}
