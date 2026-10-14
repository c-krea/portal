"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { editarLectura, type MedidorState } from "@/app/(app)/medidores/actions"
import type { MedidorAdminRow } from "@/lib/data/medidores"
import { X } from "lucide-react"

const initial: MedidorState = {}

export function EditarLecturaDialog({
  row,
  periodo,
  onClose,
}: {
  row: MedidorAdminRow
  periodo: string
  onClose: () => void
}) {
  const router = useRouter()
  const [state, action, pending] = useActionState(editarLectura, initial)
  const [lectura, setLectura] = useState(row.lecturaActual != null ? String(row.lecturaActual) : "")

  useEffect(() => {
    if (state.success) router.refresh()
  }, [state.success, router])

  // No earlier reading → baseline: anterior follows actual, nothing is billed.
  const esBase = row.prevPeriodo == null
  const actualNum = Number(lectura)
  const consumo = !esBase && lectura !== "" && row.lecturaAnterior != null
    ? Math.round((actualNum - row.lecturaAnterior) * 100) / 100
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Corregir lectura · Local {row.unitNumber}</h2>
            <p className="text-xs text-slate-500">{row.tenantName ?? "—"} · {periodo}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        {state.success ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.message}</div>
            <button type="button" onClick={onClose}
              className="w-full rounded-lg bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-700">
              Cerrar
            </button>
          </div>
        ) : (
          <form action={action} className="space-y-4">
            <input type="hidden" name="readingId" value={row.readingId ?? ""} />

            {state.error && (
              <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Lectura anterior</label>
                <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-700">
                  {esBase ? "— (lectura inicial)" : row.lecturaAnterior?.toLocaleString("es-CO") ?? "—"}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Lectura actual</label>
                <input
                  name="lecturaActual" type="number" step="0.01" min={0} required
                  value={lectura} onChange={(e) => setLectura(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              {esBase
                ? "Lectura inicial: queda como punto de partida, no se cobra."
                : consumo != null && consumo >= 0
                  ? <>Consumo resultante: <span className="font-semibold text-slate-900">{consumo.toLocaleString("es-CO")} kWh</span> (antes {row.kwh?.toLocaleString("es-CO") ?? "—"}). El total se recalcula con la tarifa del mes.</>
                  : consumo != null
                    ? <span className="text-rose-600">La lectura actual no puede ser menor a la anterior.</span>
                    : null}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Notas / motivo</label>
              <input
                name="notas" type="text" maxLength={500} defaultValue={row.notas ?? ""}
                placeholder="Ej: Error de digitación del arrendatario"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <p className="text-[11px] text-slate-400">Solo se modifica este mes; la lectura del mes siguiente no cambia.</p>

            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={onClose}
                className="rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Cancelar
              </button>
              <button type="submit" disabled={pending || lectura === "" || (consumo != null && consumo < 0)}
                className="rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {pending ? "Guardando…" : "Guardar corrección"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
