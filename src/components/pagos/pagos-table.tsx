"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatCOP, formatDateShort } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown } from "lucide-react"
import type { PagoRow } from "@/lib/data/pagos"
import type { FechaSelection } from "@/app/(app)/pagos/page"
import { classifyPagoBucket } from "@/lib/pago-bucket"

type BucketKey = "temprano" | "tardio" | "mora"
type SortKey = "fecha" | "local" | "inquilino" | "estado" | "factura" | "valor"
type Panel = "fecha" | "estado" | "local" | null

const ESTADO_META: Record<BucketKey, { label: string; pill: string; checkbox: string }> = {
  temprano: { label: "Al día", pill: "bg-emerald-50 text-emerald-700 ring-emerald-200", checkbox: "accent-emerald-600" },
  tardio:   { label: "Gracia", pill: "bg-amber-50 text-amber-700 ring-amber-200",       checkbox: "accent-amber-600" },
  mora:     { label: "Mora",   pill: "bg-rose-50 text-rose-700 ring-rose-200",          checkbox: "accent-rose-600" },
}
const ESTADO_ORDER: Record<BucketKey, number> = { temprano: 0, tardio: 1, mora: 2 }

const FECHA_PRESETS: { key: string; label: string }[] = [
  { key: "este-mes",   label: "Este mes" },
  { key: "mes-pasado", label: "Mes pasado" },
  { key: "todo",       label: "Todo el tiempo" },
]

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

// "202607" → "Jul 2026". Manual abbrevs on purpose: es-CO short-month
// formatting varies ("jul." vs "jul"), this always matches the spec example.
function periodoNumLabel(n: number): string {
  const s = String(n)
  const m = Number(s.slice(4, 6))
  return `${MESES[m - 1] ?? "?"} ${s.slice(0, 4)}`
}

// Estado rule lives in one place (src/lib/pago-bucket.ts). The yyyymm it needs
// is each row's own calendar month — a per-row fact, independent of the page's
// date range (for a single-month view this is identical to the old code).
function bucketOf(p: PagoRow, gracePeriod: number): BucketKey {
  return classifyPagoBucket(p, gracePeriod, Number(p.fechaRecaudo.slice(0, 7).replace("-", "")))
}

function FacturaPill({ p }: { p: PagoRow }) {
  if (p.invoicePeriodo == null) {
    return (
      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400">
        —
      </span>
    )
  }
  if (p.invoicePeriodo === Number(p.fechaRecaudo.slice(0, 7).replace("-", ""))) {
    return (
      <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
        Este mes
      </span>
    )
  }
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 ring-1 ring-slate-200">
      {periodoNumLabel(p.invoicePeriodo)}
    </span>
  )
}

// Windowed page numbers: 1 … (c-1) c (c+1) … N with a 2-page edge.
function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = [...new Set(
    [1, 2, current - 1, current, current + 1, total - 1, total].filter((n) => n >= 1 && n <= total),
  )].sort((a, b) => a - b)
  const out: (number | "…")[] = []
  pages.forEach((n, i) => {
    if (i > 0 && n - pages[i - 1] > 1) out.push("…")
    out.push(n)
  })
  return out
}

function SortHeader({
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
    <th className={cn("px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500", right ? "text-right" : "text-left")}>
      <button
        onClick={() => onSort(k)}
        className={cn("inline-flex items-center gap-1 uppercase tracking-wider hover:text-slate-800", active ? "text-slate-800" : "text-slate-500")}
      >
        {label}
        {active ? (
          sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    </th>
  )
}

export function PagosTable({
  data,
  gracePeriod,
  fecha,
}: {
  data: PagoRow[]
  gracePeriod: number
  fecha: FechaSelection
}) {
  const router = useRouter()
  // Empty = no filter applied (shows everything); picking one narrows it. Same
  // rule for both Estado and Local.
  const [estados, setEstados] = useState<BucketKey[]>([])
  const [locales, setLocales] = useState<string[]>([])
  const [sortKey, setSortKey] = useState<SortKey>("fecha")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [openPanel, setOpenPanel] = useState<Panel>(null)
  const [draftDesde, setDraftDesde] = useState(fecha.from)
  const [draftHasta, setDraftHasta] = useState(fecha.to)
  const toolbarRef = useRef<HTMLDivElement>(null)

  // Panels are floating (absolute): opening one never moves the table.
  useEffect(() => {
    if (!openPanel) return
    const onDown = (e: PointerEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) setOpenPanel(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenPanel(null)
    }
    document.addEventListener("pointerdown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [openPanel])

  function togglePanel(p: Exclude<Panel, null>) {
    if (openPanel === p) {
      setOpenPanel(null)
    } else {
      // Reopening shows the currently applied range, not a stale draft.
      if (p === "fecha") {
        setDraftDesde(fecha.from)
        setDraftHasta(fecha.to)
      }
      setOpenPanel(p)
    }
  }

  function pickPreset(preset: string) {
    setOpenPanel(null)
    router.push(`/pagos?preset=${preset}`)
  }

  function applyCustom() {
    if (!draftDesde || !draftHasta) return
    setOpenPanel(null)
    router.push(`/pagos?desde=${draftDesde}&hasta=${draftHasta}`)
  }

  function toggleEstado(b: BucketKey) {
    setEstados((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]))
  }

  function toggleLocal(u: string) {
    setLocales((prev) => (prev.includes(u) ? prev.filter((x) => x !== u) : [...prev, u]))
  }

  // Derived from the loaded rows, not hardcoded — matches whatever units
  // actually have payments in the current Fecha range. Numeric-first sort
  // ("2" before "10") since unit numbers are strings like "205"/"117".
  const unitOptions = useMemo(() => {
    const units = new Set<string>()
    for (const p of data) if (p.unitNumber) units.add(p.unitNumber)
    return [...units].sort((a, b) => a.localeCompare(b, "es", { numeric: true }))
  }, [data])

  function onSort(k: SortKey) {
    if (k === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(k)
      setSortDir(k === "fecha" || k === "valor" ? "desc" : "asc")
    }
  }

  const filterKey = `${[...estados].sort().join(",")}|${[...locales].sort().join(",")}|${pageSize}|${fecha.from}|${fecha.to}|${data.length}`
  const [lastFilterKey, setLastFilterKey] = useState(filterKey)
  if (lastFilterKey !== filterKey) {
    setLastFilterKey(filterKey)
    setPage(1)
  }

  const filtered = useMemo(() => {
    return data.filter((p) => {
      if (estados.length > 0 && !estados.includes(bucketOf(p, gracePeriod))) return false
      if (locales.length > 0 && !(p.unitNumber && locales.includes(p.unitNumber))) return false
      return true
    })
  }, [data, estados, locales, gracePeriod])

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "fecha":
          return a.fechaRecaudo.localeCompare(b.fechaRecaudo) * dir
        case "local":
          if (a.unitNumber == null && b.unitNumber == null) return 0
          if (a.unitNumber == null) return 1
          if (b.unitNumber == null) return -1
          return a.unitNumber.localeCompare(b.unitNumber, "es") * dir
        case "inquilino":
          return a.clienteName.localeCompare(b.clienteName, "es") * dir
        case "estado":
          return (ESTADO_ORDER[bucketOf(a, gracePeriod)] - ESTADO_ORDER[bucketOf(b, gracePeriod)]) * dir
        case "factura":
          if (a.invoicePeriodo == null && b.invoicePeriodo == null) return 0
          if (a.invoicePeriodo == null) return 1
          if (b.invoicePeriodo == null) return -1
          return (a.invoicePeriodo - b.invoicePeriodo) * dir
        case "valor":
          return (a.valorFinal - b.valorFinal) * dir
      }
    })
  }, [filtered, sortKey, sortDir, gracePeriod])

  const filteredTotal = filtered.reduce((s, p) => s + p.valorFinal, 0)
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize)
  const rangeA = sorted.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeB = Math.min(safePage * pageSize, sorted.length)

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        {/* Floating filter panels live inside `relative` wrappers below, so the
            toolbar keeps its height whether a panel is open or not. The Fecha
            (server range) and Estado (client multi-select) selections are
            independent and combine as AND. I checked the shared dropdown-menu
            primitive (Base UI Menu in a Portal): it closes on selection and has
            no room for persistent checkboxes + date inputs, so these panels are
            hand-rolled absolute popovers with outside-click / Escape to close. */}
        <div ref={toolbarRef} className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <button
              onClick={() => togglePanel("fecha")}
              className="flex h-10 min-w-[170px] items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 hover:border-slate-300"
            >
              Fecha: {fecha.label}
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
            {openPanel === "fecha" && (
              <div className="absolute left-0 top-full z-20 mt-1 w-72 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                <div className="flex flex-col gap-1">
                  {FECHA_PRESETS.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => pickPreset(p.key)}
                      className={cn(
                        "rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-100",
                        fecha.preset === p.key ? "font-semibold text-slate-900" : "text-slate-600",
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="my-2 border-t border-slate-100" />
                <div className="flex items-center gap-2">
                  <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-slate-500">
                    Desde
                    <input
                      type="date"
                      value={draftDesde}
                      max={draftHasta}
                      onChange={(e) => setDraftDesde(e.target.value)}
                      className="w-full min-w-0 rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                    />
                  </label>
                  <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-slate-500">
                    Hasta
                    <input
                      type="date"
                      value={draftHasta}
                      min={draftDesde}
                      onChange={(e) => setDraftHasta(e.target.value)}
                      className="w-full min-w-0 rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                    />
                  </label>
                </div>
                <button
                  onClick={applyCustom}
                  className="mt-2 w-full rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
                >
                  Aplicar
                </button>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => togglePanel("estado")}
              className="flex h-10 min-w-[120px] items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 hover:border-slate-300"
            >
              Estado{estados.length > 0 ? `: ${estados.length}` : ""}
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
            {openPanel === "estado" && (
              <div className="absolute left-0 top-full z-20 mt-1 w-48 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                {(Object.keys(ESTADO_META) as BucketKey[]).map((b) => (
                  <label
                    key={b}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    <input
                      type="checkbox"
                      checked={estados.includes(b)}
                      onChange={() => toggleEstado(b)}
                      className={cn("h-4 w-4 rounded", ESTADO_META[b].checkbox)}
                    />
                    {ESTADO_META[b].label}
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => togglePanel("local")}
              className="flex h-10 min-w-[120px] items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 hover:border-slate-300"
            >
              Local{locales.length > 0 ? `: ${locales.length}` : ""}
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
            {openPanel === "local" && (
              <div className="absolute left-0 top-full z-20 mt-1 max-h-64 w-44 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                {unitOptions.length === 0 ? (
                  <p className="px-2 py-1.5 text-sm text-slate-400">Sin locales</p>
                ) : (
                  unitOptions.map((u) => (
                    <label
                      key={u}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      <input
                        type="checkbox"
                        checked={locales.includes(u)}
                        onChange={() => toggleLocal(u)}
                        className="h-4 w-4 rounded accent-slate-700"
                      />
                      Local {u}
                    </label>
                  ))
                )}
              </div>
            )}
          </div>
          <span className="ml-auto whitespace-nowrap text-sm text-slate-500">
            {filtered.length} pagos · <span className="font-semibold text-slate-900">{formatCOP(filteredTotal)}</span> total
          </span>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-sm text-slate-400">
            {data.length === 0 ? "No hay pagos registrados aún" : "Sin resultados para este filtro"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <SortHeader k="fecha" label="Fecha" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortHeader k="local" label="Local" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortHeader k="inquilino" label="Inquilino" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortHeader k="estado" label="Estado" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortHeader k="factura" label="Factura" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortHeader k="valor" label="Valor" right sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              </tr>
            </thead>
            <tbody>
              {paginated.map((p) => {
                const isAnticipo = p.valorFinal < 0
                const estado = bucketOf(p, gracePeriod)
                return (
                  <tr key={p.id} className={cn("border-b border-slate-50 hover:bg-slate-50", isAnticipo && "bg-rose-50/40")}>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateShort(p.fechaRecaudo)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{p.unitNumber ? `Local ${p.unitNumber}` : "—"}</td>
                    <td className="px-4 py-3">
                      <Link href={`/locales/${p.tenantId}`} className="font-medium text-slate-900 hover:text-blue-600 hover:underline">
                        {p.clienteName}
                      </Link>
                      {isAnticipo && <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-700">Anticipo</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1", ESTADO_META[estado].pill)}>
                        {ESTADO_META[estado].label}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <FacturaPill p={p} />
                    </td>
                    <td className={cn("whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums", isAnticipo ? "text-rose-600" : "text-slate-900")}>
                      {formatCOP(p.valorFinal)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
        <p className="text-xs text-slate-400">
          Mostrando {rangeA}–{rangeB} de {sorted.length}
        </p>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            Filas
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-700 focus:border-slate-400 focus:outline-none"
            >
              {[25, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, safePage - 1))}
                disabled={safePage === 1}
                aria-label="Página anterior"
                className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                ‹
              </button>
              {pageWindow(safePage, totalPages).map((n, i) =>
                n === "…" ? (
                  <span key={`gap-${i}`} className="px-1 text-xs text-slate-400">…</span>
                ) : (
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
                ),
              )}
              <button
                onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                disabled={safePage === totalPages}
                aria-label="Página siguiente"
                className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
