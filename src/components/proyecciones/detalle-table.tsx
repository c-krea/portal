"use client"

import { useState, useTransition } from "react"
import { formatCOP } from "@/lib/formatters"
import type { ProyeccionDetalle } from "@/lib/data/proyecciones"
import { updateContratoPhase, type UpdatePhaseState } from "@/app/(app)/proyecciones/actions"

const STATUS_LABEL: Record<string, string> = {
  activo:   "Activo",
  critico:  "Crítico",
  inactivo: "Inactivo",
  moroso:   "Moroso",
}

const STATUS_COLOR: Record<string, string> = {
  activo:   "bg-emerald-50 text-emerald-700",
  critico:  "bg-rose-50 text-rose-700",
  inactivo: "bg-slate-100 text-slate-500",
  moroso:   "bg-amber-50 text-amber-700",
}

const MONTH_NAMES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]

function monthLabel(m: number | null): string {
  if (m == null) return "—"
  if (m < 1 || m > 12) return "—"
  return MONTH_NAMES[m - 1]
}

function formatDate(raw: string | null): string {
  if (!raw) return "—"
  const d = new Date(raw)
  const dd = String(d.getUTCDate()).padStart(2, "0")
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0")
  const yy = String(d.getUTCFullYear()).slice(2)
  return `${dd}/${mm}/${yy}`
}

type SortKey = keyof Pick<
  ProyeccionDetalle,
  "unitNumber" | "cliente" | "tipoPersona" | "fechaInicio" | "mesesTranscurridos" | "canonMensual" | "descuentoPhasePct" | "descuentoHastaMes" | "prontoPagoPct" | "ppHistoricoPct" | "netoEsperadoIVA" | "status"
>

type SortDir = "asc" | "desc"

const COLS: { key: SortKey; label: string; align: "left" | "right" | "center"; hide?: string }[] = [
  { key: "unitNumber",         label: "Local",        align: "left" },
  { key: "cliente",             label: "Arrendatario", align: "left" },
  { key: "tipoPersona",         label: "Tipo",         align: "center", hide: "hidden sm:table-cell" },
  { key: "fechaInicio",         label: "Desde",        align: "left",   hide: "hidden md:table-cell" },
  { key: "mesesTranscurridos",  label: "Meses",        align: "right",  hide: "hidden md:table-cell" },
  { key: "canonMensual",        label: "Canon / mes",  align: "right",  hide: "hidden sm:table-cell" },
  { key: "descuentoPhasePct",   label: "Dcto",         align: "right",  hide: "hidden md:table-cell" },
  { key: "descuentoHastaMes",   label: "Hasta",        align: "center", hide: "hidden md:table-cell" },
  { key: "prontoPagoPct",       label: "PP",           align: "right",  hide: "hidden lg:table-cell" },
  { key: "ppHistoricoPct",      label: "PP hist.",     align: "right",  hide: "hidden lg:table-cell" },
  { key: "netoEsperadoIVA",     label: "Esperado anual", align: "right" },
  { key: "status",              label: "Estado",       align: "center" },
]

function compare(a: ProyeccionDetalle, b: ProyeccionDetalle, key: SortKey, dir: SortDir): number {
  const av = a[key]
  const bv = b[key]
  const sign = dir === "asc" ? 1 : -1
  if (av === null && bv === null) return 0
  if (av === null) return sign
  if (bv === null) return -sign
  if (typeof av === "number" && typeof bv === "number") return (av - bv) * sign
  return String(av).localeCompare(String(bv)) * sign
}

export function DetalleTable({ data, year }: { data: ProyeccionDetalle[]; year: number }) {
  const [sortKey, setSortKey] = useState<SortKey>("unitNumber")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [editing, setEditing] = useState<ProyeccionDetalle | null>(null)

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const sorted = [...data].sort((a, b) => compare(a, b, sortKey, sortDir))

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {COLS.map(({ key, label, align, hide }) => {
                const active = sortKey === key
                const indicator = active ? (sortDir === "asc" ? " ↑" : " ↓") : ""
                return (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className={`cursor-pointer select-none px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 hover:text-slate-800 ${
                      align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
                    }${active ? " text-slate-800" : ""}${hide ? ` ${hide}` : ""}`}
                  >
                    {label}{indicator}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sorted.map((row) => (
              <tr
                key={row.contractId}
                onClick={() => setEditing(row)}
                className="cursor-pointer hover:bg-slate-50"
              >
                <td className="px-4 py-2.5 font-mono text-xs font-semibold text-slate-800">{row.unitNumber}</td>
                <td className="px-4 py-2.5 text-sm text-slate-700">{row.cliente}</td>
                <td className="hidden sm:table-cell px-4 py-2.5 text-center">
                  <span
                    title={row.tipoPersona === "PJ" ? "Persona Jurídica · retefuente 3.5%" : "Persona Natural · sin retefuente"}
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      row.tipoPersona === "PJ"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {row.tipoPersona}
                  </span>
                </td>
                <td className="hidden md:table-cell px-4 py-2.5 text-xs text-slate-500">{formatDate(row.fechaInicio)}</td>
                <td className="hidden md:table-cell px-4 py-2.5 text-right text-slate-700">{row.mesesTranscurridos}</td>
                <td className="hidden sm:table-cell px-4 py-2.5 text-right font-mono text-slate-900">{formatCOP(row.canonMensual)}</td>
                <td className="hidden md:table-cell px-4 py-2.5 text-right">
                  {row.descuentoPhasePct != null && row.descuentoPhasePct > 0 ? (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      {Number(row.descuentoPhasePct).toFixed(0)}%
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="hidden md:table-cell px-4 py-2.5 text-center text-xs text-slate-600">
                  {row.descuentoHastaMes != null ? (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                      {monthLabel(row.descuentoHastaMes)}
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="hidden lg:table-cell px-4 py-2.5 text-right text-slate-600">
                  {row.prontoPagoPct > 0 ? (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {row.prontoPagoPct}%
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="hidden lg:table-cell px-4 py-2.5 text-right text-slate-600">
                  {row.ppHistoricoPct > 0 ? (
                    <span
                      title={`${row.ppHistoricoPagos} pagos analizados`}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        row.ppHistoricoPct >= 40
                          ? "bg-emerald-50 text-emerald-700"
                          : row.ppHistoricoPct >= 10
                          ? "bg-amber-50 text-amber-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {row.ppHistoricoPct.toFixed(0)}%
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-900">{formatCOP(row.netoEsperadoIVA)}</td>
                <td className="px-4 py-2.5 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[row.status] ?? "bg-slate-100 text-slate-500"}`}>
                    {STATUS_LABEL[row.status] ?? row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditPhaseModal
          row={editing}
          year={year}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}

function EditPhaseModal({
  row,
  year,
  onClose,
}: {
  row: ProyeccionDetalle
  year: number
  onClose: () => void
}) {
  const [phasePct, setPhasePct] = useState<string>(row.descuentoPhasePct == null ? "" : String(row.descuentoPhasePct))
  const [hastaMes, setHastaMes] = useState<string>(row.descuentoHastaMes == null ? "" : String(row.descuentoHastaMes))
  const [state, setState] = useState<UpdatePhaseState>({ success: false })
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateContratoPhase(state, fd)
      setState(result)
      if (result.success) onClose()
    })
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
      >
        <div className="mb-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Local {row.unitNumber}</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-800">{row.cliente}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <input type="hidden" name="contractId" value={row.contractId} />
          <input type="hidden" name="year" value={year} />

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Descuento de fase (%)
            </label>
            <input
              type="number"
              name="phasePct"
              min={0}
              max={100}
              step={1}
              value={phasePct}
              onChange={(e) => setPhasePct(e.target.value)}
              placeholder="—"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <p className="mt-1 text-xs text-slate-400">Vacío = sin descuento de fase (solo PP)</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Hasta el mes
            </label>
            <select
              name="hastaMes"
              value={hastaMes}
              onChange={(e) => setHastaMes(e.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="">—</option>
              {MONTH_NAMES.map((name, i) => (
                <option key={i + 1} value={i + 1}>
                  {name} ({i + 1})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">Último mes en que aplica el descuento; después solo PP.</p>
          </div>

          {state.error && (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">{state.error}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {pending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
