"use client"

import { useActionState, useState } from "react"
import { ChevronDown } from "lucide-react"
import { guardarTasaMora, type TasaState } from "@/app/(app)/mora/actions"

const initial: TasaState = {}

/** Compact top-right control to set the month's DIAN mora rate; panel drops open below. */
export function TasaMoraForm({ periodo, tasaEa }: { periodo: string; tasaEa: number | null }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(guardarTasaMora, initial)

  const currentEa = state.success && state.tasaEa != null ? state.tasaEa : tasaEa
  const pct = currentEa != null ? Number((currentEa * 100).toFixed(4)) : null
  const diaria = currentEa != null ? (currentEa / 366) * 100 : null
  const falta = currentEa == null

  return (
    <div className="relative">
      {/* compact box */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm shadow-sm transition-colors ${
          falta
            ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
            : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
        }`}
      >
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Tasa DIAN</span>
        <span className="font-bold tabular-nums">{falta ? "—" : `${pct}%`}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          {/* click-outside to close */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          {/* panel drops open below the box */}
          <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-lg">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Tasa interés mora DIAN · {periodo}
            </p>
            {falta ? (
              <p className="mt-1 text-sm font-semibold text-amber-700">
                Falta la tasa de este mes — el interés se muestra en $0
              </p>
            ) : (
              <p className="mt-1 text-sm font-bold text-slate-900 tabular-nums">
                {pct}% E.A.{" "}
                <span className="font-normal text-slate-400">· {diaria!.toFixed(4)}%/día</span>
              </p>
            )}

            <form action={action} className="mt-3 flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  name="tasaPct"
                  step="0.01"
                  min="0"
                  max="100"
                  defaultValue={pct ?? ""}
                  placeholder="26.79"
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 pr-6 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            {state.error && <p className="mt-2 text-xs text-rose-600">{state.error}</p>}
            {state.success && <p className="mt-2 text-xs text-emerald-600">Tasa actualizada.</p>}
            <p className="mt-2 text-[11px] leading-snug text-slate-400">
              Tasa efectiva anual DIAN (art. 635 E.T.); se aplica a toda la mora del mes.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
