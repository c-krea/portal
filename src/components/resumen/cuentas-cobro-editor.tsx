"use client"

import { useActionState, useState } from "react"
import { History, Pencil } from "lucide-react"
import { guardarCuentasCobro, type CuentasCobroState } from "@/app/(app)/cuentas-cobro-actions"
import type { CuentasCobroCambio } from "@/lib/data/cuentas-cobro"
import { formatCOP } from "@/lib/formatters"

const initial: CuentasCobroState = {}

function fechaHora(iso: string): string {
  return new Date(iso).toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function Cambio({ antes, despues }: { antes: number | null; despues: number }) {
  if (antes == null) return <span className="font-semibold text-slate-800">{formatCOP(despues)}</span>
  if (antes === despues) return <span className="text-slate-500">{formatCOP(despues)}</span>
  return (
    <span>
      <span className="text-slate-400 line-through">{formatCOP(antes)}</span>{" "}
      <span className="font-semibold text-slate-800">{formatCOP(despues)}</span>
    </span>
  )
}

/** Pencil + history panel for the Cuentas de cobro card (Resumen). */
export function CuentasCobroEditor({
  periodo,
  ejecutado,
  proyectado,
  historial,
  canEdit,
}: {
  periodo: string
  ejecutado: number
  proyectado: number
  historial: CuentasCobroCambio[]
  canEdit: boolean
}) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(guardarCuentasCobro, initial)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={canEdit ? "Registrar cuentas de cobro" : "Ver historial"}
        className="inline-flex text-[#2ea89a] hover:opacity-80"
      >
        {canEdit ? <Pencil className="h-5 w-5" /> : <History className="h-5 w-5" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-4 text-left shadow-lg">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Cuentas de cobro · {periodo}</p>

            {canEdit ? (
              <form action={action} className="mt-3 space-y-2">
                <input type="hidden" name="periodo" value={periodo} />
                <label className="block text-sm text-slate-600">
                  Ejecutado
                  <input
                    type="number"
                    name="ejecutado"
                    min="0"
                    step="1"
                    required
                    defaultValue={ejecutado}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
                <label className="block text-sm text-slate-600">
                  Proyectado
                  <input
                    type="number"
                    name="proyectado"
                    min="0"
                    step="1"
                    required
                    defaultValue={proyectado}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {pending ? "Guardando…" : "Guardar"}
                </button>
                {state.error && <p className="text-xs text-rose-600">{state.error}</p>}
                {state.success && (
                  <p className="text-xs text-emerald-600">{state.sinCambios ? "Sin cambios." : "Guardado."}</p>
                )}
              </form>
            ) : (
              <p className="mt-2 text-xs text-slate-500">Solo admin y finanzas pueden modificar estos valores.</p>
            )}

            <div className="mt-4 border-t border-dashed border-slate-200 pt-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <History className="h-3.5 w-3.5" />
                Historial de cambios
              </p>
              {historial.length === 0 ? (
                <p className="mt-2 text-sm text-slate-400">Sin registros para este mes.</p>
              ) : (
                <ul className="mt-2 max-h-64 divide-y divide-slate-100 overflow-y-auto text-xs">
                  {historial.map((h) => (
                    <li key={h.id} className="py-2">
                      <p className="font-medium text-slate-700">
                        {h.usuarioNombre} <span className="font-normal text-slate-400">· {fechaHora(h.createdAt)}</span>
                      </p>
                      <p className="mt-0.5 text-slate-500">
                        Ejecutado: <Cambio antes={h.ejecutadoAnterior} despues={h.ejecutado} />
                      </p>
                      <p className="text-slate-500">
                        Proyectado: <Cambio antes={h.proyectadoAnterior} despues={h.proyectado} />
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/** "Modificado por X · fecha" line under the card. */
export function CuentasCobroUltimoCambio({ cambio }: { cambio: CuentasCobroCambio | undefined }) {
  if (!cambio) return <span>Sin registrar este mes</span>
  return (
    <span>
      Modificado por <span className="font-medium text-slate-700">{cambio.usuarioNombre}</span> · {fechaHora(cambio.createdAt)}
    </span>
  )
}
