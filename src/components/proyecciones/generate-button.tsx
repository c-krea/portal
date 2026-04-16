"use client"

import { useState } from "react"
import { Settings, X } from "lucide-react"
import { useActionState } from "react"
import { generarProyecciones, type GenerateProyeccionesState } from "@/app/(app)/proyecciones/actions"

type Props = { defaultYear: number; defaultIpc: number }

const initialState: GenerateProyeccionesState = { success: false }

export function GenerateButton({ defaultYear, defaultIpc }: Props) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(generarProyecciones, initialState)

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-white shadow-lg hover:bg-slate-700 transition-colors"
        title="Generar proyecciones"
      >
        <Settings className="h-5 w-5" />
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-6">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">Generar proyecciones</h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form action={action} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Año</label>
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
                  <label className="mb-1 block text-xs font-medium text-slate-600">IPC (%)</label>
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
                Canon nuevo = último canon × (1 + IPC%). Solo contratos activos sin proyección del año.
              </p>

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {pending ? "Generando..." : "Generar proyecciones"}
              </button>
            </form>

            {state.success && state.created !== undefined && (
              <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm">
                <p className="font-medium text-emerald-800">
                  {state.created === 0
                    ? "Todos los contratos ya tienen proyección para ese año."
                    : `✓ ${state.created} contrato${state.created !== 1 ? "s" : ""} generados`}
                </p>
                {state.errors && state.errors.length > 0 && (
                  <ul className="mt-2 space-y-0.5 text-xs text-rose-700">
                    {state.errors.map((e, i) => <li key={i}>⚠ {e}</li>)}
                  </ul>
                )}
              </div>
            )}
            {state.error && (
              <div className="mt-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{state.error}</div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
