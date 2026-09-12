"use client"

import { useMemo, useState } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { formatCOP } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import { CAT_COLORS } from "./cat-colors"

export type GastoExpenseLine = {
  name: string
  amount: number
  category: string
  gastoTypeName: string
}

type SortKey = "name" | "amount"

// Shared across header and body so every row's cells land in the same
// columns. Grid, not <table>: a native table can't compress row height
// below its content's natural minimum, so a month with many lines would
// overflow this card's fixed height. Grid rows can — `minmax(0, 1fr)`
// divides whatever height the card has evenly across every row, however
// many there are, so everything shows at once with no second page.
const COLS = "grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)_110px_70px]"

function SortHeaderCell({
  k,
  label,
  right,
  sortKey,
  sortDir,
  onSort,
}: {
  k: SortKey
  label: string
  right?: boolean
  sortKey: SortKey
  sortDir: "asc" | "desc"
  onSort: (k: SortKey) => void
}) {
  const active = sortKey === k
  return (
    <div className={cn("flex items-center px-3 py-1.5", right ? "justify-end" : "justify-start")}>
      <button
        onClick={() => onSort(k)}
        className={cn(
          "inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider hover:text-slate-800",
          active ? "text-slate-800" : "text-slate-500",
        )}
      >
        {label}
        {active ? (
          sortDir === "asc" ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />
        ) : (
          <ArrowUpDown className="h-2.5 w-2.5 opacity-40" />
        )}
      </button>
    </div>
  )
}

export function GastosExpenseTable({ data }: { data: GastoExpenseLine[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("amount")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const grandTotal = useMemo(() => data.reduce((s, e) => s + e.amount, 0), [data])

  function onSort(k: SortKey) {
    if (k === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(k)
      setSortDir(k === "name" ? "asc" : "desc")
    }
  }

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1
    return [...data].sort((a, b) =>
      sortKey === "name"
        ? a.name.localeCompare(b.name, "es") * dir
        : (a.amount - b.amount) * dir,
    )
  }, [data, sortKey, sortDir])

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <p className="text-sm font-semibold text-slate-900">Gastos del período</p>
        <span className="whitespace-nowrap text-sm text-slate-500">
          {data.length} gastos · <span className="font-semibold text-slate-900">{formatCOP(grandTotal)}</span> total
        </span>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-xs text-slate-400">No hay gastos registrados</p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className={cn("grid shrink-0 border-b border-slate-100", COLS)}>
            <SortHeaderCell k="name" label="Gasto" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
            <div className="flex items-center px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
              Categoría
            </div>
            <SortHeaderCell k="amount" label="Monto" right sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
            <div className="flex items-center justify-end px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
              % total
            </div>
          </div>

          {/* Every row is `minmax(0, 1fr)` tall — this grid divides the
              card's remaining height evenly across sorted.length rows. */}
          <div
            className={cn("grid min-h-0 flex-1 text-xs", COLS)}
            style={{ gridTemplateRows: `repeat(${sorted.length}, minmax(0, 1fr))` }}
          >
            {sorted.map((e, i) => {
              const pct = grandTotal > 0 ? (e.amount / grandTotal) * 100 : 0
              return (
                <div key={`${e.category}::${e.name}::${i}`} className="contents group">
                  <div className="flex items-center truncate border-b border-slate-50 px-3 py-1 font-medium text-slate-900 group-hover:bg-slate-50">
                    <span className="truncate">{e.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate border-b border-slate-50 px-3 py-1 text-slate-600 group-hover:bg-slate-50">
                    <span
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{ background: CAT_COLORS[e.category] ?? "#94a3b8" }}
                    />
                    <span className="truncate">{e.gastoTypeName}</span>
                  </div>
                  <div className="flex items-center justify-end whitespace-nowrap border-b border-slate-50 px-3 py-1 text-right font-semibold tabular-nums text-slate-900 group-hover:bg-slate-50">
                    {formatCOP(e.amount)}
                  </div>
                  <div className="flex items-center justify-end whitespace-nowrap border-b border-slate-50 px-3 py-1 text-right text-xs tabular-nums text-slate-500 group-hover:bg-slate-50">
                    {pct.toFixed(1)}%
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
