"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { formatCOP, formatDateShort } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"
import type { PagoRow } from "@/lib/data/pagos"

type Bucket = "todos" | "temprano" | "tardio" | "mora"
const PAGE_SIZE = 50

const BUCKET_BUTTONS: { key: Bucket; label: string; cls: string }[] = [
  { key: "todos",    label: "Todos",            cls: "bg-slate-100 text-slate-700" },
  { key: "temprano", label: "Primeros 10 días", cls: "bg-emerald-50 text-emerald-700" },
  { key: "tardio",   label: "Del 11 al 30",     cls: "bg-amber-50 text-amber-700" },
  { key: "mora",     label: "Desde mora",       cls: "bg-rose-50 text-rose-700" },
]

function bucketFor(p: PagoRow, gracePeriod: number): "temprano" | "tardio" | "mora" {
  if (p.diasMoraAlPago > gracePeriod) return "mora"
  const day = Number((p.fechaRecaudo ?? "").slice(8, 10))
  return day >= 1 && day <= 10 ? "temprano" : "tardio"
}

export function PagosTable({
  data,
  gracePeriod,
}: {
  data: PagoRow[]
  gracePeriod: number
}) {
  const [q, setQ] = useState("")
  const [bucket, setBucket] = useState<Bucket>("todos")
  const [page, setPage] = useState(1)
  const filterKey = `${q}|${bucket}`
  const [lastFilterKey, setLastFilterKey] = useState(filterKey)
  if (lastFilterKey !== filterKey) {
    setLastFilterKey(filterKey)
    setPage(1)
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return data.filter((p) => {
      if (bucket !== "todos" && bucketFor(p, gracePeriod) !== bucket) return false
      if (!needle) return true
      return (
        p.clienteName.toLowerCase().includes(needle) ||
        (p.unitNumber ?? "").toLowerCase().includes(needle) ||
        (p.siesaDocto ?? "").toLowerCase().includes(needle)
      )
    })
  }, [data, q, bucket, gracePeriod])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-800">Historial de Pagos</h2>
            <p className="text-xs text-slate-400">
              {filtered.length} de {data.length} movimientos · Fuente: CSF ERP
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar cliente, local o doc…"
              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {BUCKET_BUTTONS.map((b) => {
            const active = bucket === b.key
            return (
              <button
                key={b.key}
                onClick={() => setBucket(b.key)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  active ? b.cls : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50",
                )}
              >
                {b.label}
              </button>
            )
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-sm text-slate-400">
            {data.length === 0 ? "No hay pagos registrados aún" : "Sin resultados para tu búsqueda"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Cliente</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Documento</th>
                <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Cruce</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Monto</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {paginated.map((p) => {
                const isAnticipo = p.valorFinal < 0
                return (
                  <tr key={p.id} className={cn("border-b border-slate-50 hover:bg-slate-50", isAnticipo && "bg-rose-50/40")}>
                    <td className="px-4 py-3 text-slate-600">{formatDateShort(p.fechaRecaudo)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{p.clienteName}</p>
                      <p className="text-xs text-slate-400">
                        {p.unitNumber ? `Local ${p.unitNumber}` : ""}
                        {isAnticipo && <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-700">Anticipo</span>}
                      </p>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-xs font-mono text-slate-500">
                      {p.siesaDocto ?? "—"}
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3 text-xs font-mono text-slate-400">
                      {p.siesaCruce ?? "—"}
                    </td>
                    <td className={cn("px-4 py-3 text-right font-semibold tabular-nums", isAnticipo ? "text-rose-600" : "text-slate-900")}>
                      {formatCOP(p.valorFinal)}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/locales/${p.tenantId}`} className="text-xs text-blue-600 hover:underline">
                        Ver
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
          <p className="text-xs text-slate-400">
            Página {safePage} de {totalPages} · {filtered.length} pagos
          </p>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  n === safePage
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
