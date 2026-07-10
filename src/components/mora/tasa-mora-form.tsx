"use client"

import { useActionState } from "react"
import { guardarTasaMora, type TasaState } from "@/app/(app)/mora/actions"

const initial: TasaState = {}

/** Admin control to set the month's DIAN mora rate (art. 635 E.T.). */
export function TasaMoraForm({ periodo, tasaEa }: { periodo: string; tasaEa: number | null }) {
  const [state, action, pending] = useActionState(guardarTasaMora, initial)

  const currentEa = state.success && state.tasaEa != null ? state.tasaEa : tasaEa
  const pct = currentEa != null ? Number((currentEa * 100).toFixed(4)) : null
  const diaria = currentEa != null ? (currentEa / 366) * 100 : null
  const falta = currentEa == null

  return (
    <div
      className={`rounded-xl border p-3 sm:p-4 shadow-sm ${
        falta ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Tasa interés mora DIAN · {periodo}
          </p>
          {falta ? (
            <p className="text-sm font-semibold text-amber-700">
              Falta la tasa de este mes — el interés se muestra en $0
            </p>
          ) : (
            <p className="text-sm font-bold text-slate-900 tabular-nums">
              {pct}% E.A.{" "}
              <span className="font-normal text-slate-400">· {diaria!.toFixed(4)}%/día</span>
            </p>
          )}
        </div>

        <form action={action} className="ml-auto flex items-center gap-2">
          <div className="relative">
            <input
              type="number"
              name="tasaPct"
              step="0.01"
              min="0"
              max="100"
              defaultValue={pct ?? ""}
              placeholder="26.79"
              required
              className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-1.5 pr-6 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
              %
            </span>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {pending ? "…" : "Guardar"}
          </button>
        </form>
      </div>

      {state.error && <p className="mt-2 text-xs text-rose-600">{state.error}</p>}
      {state.success && <p className="mt-2 text-xs text-emerald-600">Tasa actualizada.</p>}
    </div>
  )
}
