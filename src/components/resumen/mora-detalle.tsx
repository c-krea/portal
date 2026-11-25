"use client"

import { Fragment, useState } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { formatCOP } from "@/lib/formatters"
import type { MoraInvoice, MoraRow } from "@/lib/data/mora"

// Mora palette: saldo vencido rose, interés violet. Cartera corriente
// (not yet due) gets its own sky tone so it never reads as mora.
const C = {
  vencido: "text-rose-600",
  interes: "text-violet-700",
  corriente: "text-sky-600",
} as const

// Urgency colours for días mora (≤30 nuevos, 31–60 en mora, >60 críticos).
function diasBadge(dias: number) {
  if (dias <= 30) return "bg-amber-50 text-amber-700"
  if (dias <= 60) return "bg-orange-50 text-orange-700"
  return "bg-rose-50 text-rose-700"
}

function DiasBadge({ dias }: { dias: number }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums ${diasBadge(dias)}`}>{dias}d</span>
  )
}

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y.slice(2)}`
}

// The tenant's locales page, on the unit of its
// most-overdue invoice.
function localHref(r: MoraRow) {
  return `/locales/${r.tenantId}${r.unitNumber ? `?unit=${r.unitNumber}` : ""}`
}

function useExpanded() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  return [expanded, toggle] as const
}

function ToggleButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? "Contraer" : "Ver facturas"}
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700"
    >
      <ChevronRight className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`} />
    </button>
  )
}

/**
 * Per-invoice detail: overdue invoices first, then cartera corriente. Colour
 * tells them apart: mora rose (días badge by urgency + saldo), corriente sky
 * (días 0 + saldo). `compact` (jurídica card) drops Local and F. factura.
 */
function FacturasDetalle({
  vencidas,
  corrientes,
  compact = false,
}: {
  vencidas: MoraInvoice[]
  corrientes: MoraInvoice[]
  compact?: boolean
}) {
  const full = !compact
  const row = (inv: MoraInvoice, corriente: boolean) => (
    <tr key={`${corriente ? "c" : "v"}-${inv.factura}`} className="text-slate-600">
      <td className="py-1 font-mono">{inv.factura}</td>
      {full && <td className="py-1">{inv.unidad ?? "—"}</td>}
      <td className="py-1 text-right">
        {corriente ? (
          <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium tabular-nums text-sky-600">0d</span>
        ) : (
          <DiasBadge dias={inv.diasVencidos} />
        )}
      </td>
      {full && <td className="py-1 text-right tabular-nums">{fmtDate(inv.fechaFactura)}</td>}
      <td className="py-1 text-right tabular-nums">{fmtDate(inv.vencimiento)}</td>
      <td className={`py-1 text-right font-mono ${corriente ? C.corriente : C.vencido}`}>
        {formatCOP(inv.saldoVencido)}
      </td>
      {corriente ? (
        <td className="py-1 text-right font-mono text-slate-300">—</td>
      ) : (
        <td className={`py-1 text-right font-mono ${C.interes}`}>{formatCOP(inv.interes)}</td>
      )}
    </tr>
  )
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-slate-400">
          <th className="py-1 text-left font-medium">Factura</th>
          {full && <th className="py-1 text-left font-medium">Local</th>}
          <th className="py-1 text-right font-medium">Días</th>
          {full && <th className="py-1 text-right font-medium">F. factura</th>}
          <th className="py-1 text-right font-medium">Vence</th>
          <th className="py-1 text-right font-medium">Saldo</th>
          <th className="py-1 text-right font-medium">Interés</th>
        </tr>
      </thead>
      <tbody>
        {vencidas.map((inv) => row(inv, false))}
        {corrientes.map((inv) => row(inv, true))}
      </tbody>
    </table>
  )
}

const totalAPagar = (r: MoraRow) => r.saldoVencido + r.interes + r.carteraCorriente

type SortKey = "cliente" | "diasMora" | "facturas" | "saldoVencido" | "interes" | "carteraCorriente" | "total"

const COLS: { key: SortKey; label: string; className: string }[] = [
  { key: "cliente", label: "Arrendatario", className: "px-3 py-3 text-left" },
  { key: "diasMora", label: "Días mora", className: "px-3 py-3 text-right" },
  { key: "facturas", label: "Facturas", className: "px-3 py-3 text-right" },
  { key: "saldoVencido", label: "Saldo vencido", className: "px-3 py-3 text-right" },
  { key: "interes", label: "Interés", className: "px-3 py-3 text-right" },
  { key: "carteraCorriente", label: "Cartera corriente", className: "px-3 py-3 text-right" },
  { key: "total", label: "Total", className: "px-5 py-3 text-right" },
]

function sortValue(r: MoraRow, key: SortKey): number | string {
  return key === "total" ? totalAPagar(r) : r[key]
}

/** /resumen "Detalle de mora": tenants in mora with an invoice dropdown (mora + corriente). */
export function MoraDetalleTable({ data }: { data: MoraRow[] }) {
  const [expanded, toggle] = useExpanded()
  const [sortKey, setSortKey] = useState<SortKey>("saldoVencido")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const sum = (f: (r: MoraRow) => number) => data.reduce((s, r) => s + f(r), 0)

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortKey(key)
      setSortDir(key === "cliente" ? "asc" : "desc")
    }
  }

  const rows = [...data].sort((a, b) => {
    const av = sortValue(a, sortKey)
    const bv = sortValue(b, sortKey)
    const sign = sortDir === "asc" ? 1 : -1
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * sign
    return String(av).localeCompare(String(bv), "es") * sign
  })

  return (
    <table className="w-full min-w-[53.75rem] text-sm">
      <thead>
        <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
          <th className="w-8 py-3 pl-3" />
          {COLS.map(({ key, label, className }) => {
            const active = sortKey === key
            return (
              <th
                key={key}
                onClick={() => handleSort(key)}
                aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                className={`${className} cursor-pointer select-none whitespace-nowrap hover:text-slate-800${active ? " text-slate-800" : ""}`}
              >
                {label}
                {active ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
              </th>
            )
          })}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {data.length === 0 ? (
          <tr>
            <td colSpan={8} className="px-5 py-6 text-center text-slate-400">
              Sin arrendatarios en mora
            </td>
          </tr>
        ) : (
          rows.map((r) => {
            const open = expanded.has(r.tenantId)
            return (
              <Fragment key={r.tenantId}>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 pl-3">
                    <ToggleButton open={open} onClick={() => toggle(r.tenantId)} />
                  </td>
                  <td className="max-w-0 truncate px-3 py-2.5 font-medium text-slate-800" title={r.cliente}>
                    <Link href={localHref(r)} className="hover:text-blue-600 hover:underline">
                      {r.cliente}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right">
                    <DiasBadge dias={r.diasMora} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-slate-600">
                    {r.facturas}
                    {r.corrientes.length > 0 && <span className="text-sky-600"> + {r.corrientes.length}</span>}
                  </td>
                  <td className={`whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums ${C.vencido}`}>
                    {formatCOP(r.saldoVencido)}
                  </td>
                  <td className={`whitespace-nowrap px-3 py-2.5 text-right tabular-nums ${C.interes}`}>
                    {formatCOP(r.interes)}
                  </td>
                  <td className={`whitespace-nowrap px-3 py-2.5 text-right tabular-nums ${C.corriente}`}>
                    {formatCOP(r.carteraCorriente)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-2.5 text-right font-semibold tabular-nums text-slate-900">
                    {formatCOP(totalAPagar(r))}
                  </td>
                </tr>
                {open && (
                  <tr className="bg-slate-50/60">
                    <td />
                    <td colSpan={7} className="px-3 pb-3 pt-0">
                      <FacturasDetalle vencidas={r.invoices} corrientes={r.corrientes} />
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })
        )}
      </tbody>
      {data.length > 0 && (
        <tfoot>
          <tr className="border-t-2 border-slate-200 bg-slate-50/60 font-semibold text-slate-900">
            <td />
            <td className="px-3 py-3">Total · {data.length} arrendatarios</td>
            <td className="px-3 py-3" />
            <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">
              {sum((r) => r.facturas)}
              <span className="text-sky-600"> + {sum((r) => r.corrientes.length)}</span>
            </td>
            <td className={`whitespace-nowrap px-3 py-3 text-right tabular-nums ${C.vencido}`}>
              {formatCOP(sum((r) => r.saldoVencido))}
            </td>
            <td className={`whitespace-nowrap px-3 py-3 text-right tabular-nums ${C.interes}`}>
              {formatCOP(sum((r) => r.interes))}
            </td>
            <td className={`whitespace-nowrap px-3 py-3 text-right tabular-nums ${C.corriente}`}>
              {formatCOP(sum((r) => r.carteraCorriente))}
            </td>
            <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums">{formatCOP(sum(totalAPagar))}</td>
          </tr>
        </tfoot>
      )}
    </table>
  )
}

/** /resumen "Cartera jurídica": same dropdown and colours, compact card layout. */
export function JuridicaList({ data }: { data: MoraRow[] }) {
  const [expanded, toggle] = useExpanded()
  return (
    <ul className="divide-y divide-slate-100">
      {data.map((r) => {
        const open = expanded.has(r.tenantId)
        const facturas = r.facturas + r.corrientes.length
        return (
          <li key={r.tenantId} className="py-2">
            <div className="flex items-center gap-2 px-1 text-sm">
              <ToggleButton open={open} onClick={() => toggle(r.tenantId)} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-800" title={r.cliente}>
                  <Link href={localHref(r)} className="hover:text-blue-600 hover:underline">
                    {r.cliente}
                  </Link>
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                  <DiasBadge dias={r.diasMora} />· {facturas} {facturas === 1 ? "factura" : "facturas"}
                </p>
              </div>
              <div className="text-right">
                <p className={`whitespace-nowrap font-semibold tabular-nums ${C.vencido}`}>
                  {formatCOP(r.saldoVencido)}
                </p>
                {r.interes > 0 && (
                  <p className={`whitespace-nowrap text-xs tabular-nums ${C.interes}`}>+ {formatCOP(r.interes)} int.</p>
                )}
                {r.carteraCorriente > 0 && (
                  <p className={`whitespace-nowrap text-xs tabular-nums ${C.corriente}`}>
                    + {formatCOP(r.carteraCorriente)} corr.
                  </p>
                )}
              </div>
            </div>
            {open && (
              <div className="mt-1 overflow-x-auto rounded-lg bg-slate-50/60 px-2 py-1">
                <FacturasDetalle vencidas={r.invoices} corrientes={r.corrientes} compact />
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
