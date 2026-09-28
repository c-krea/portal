import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { getPagosRange } from "@/lib/data/pagos"
import { PagosTable } from "@/components/pagos/pagos-table"
import { InfoTip } from "@/components/pagos/info-tip"
import { formatDateShort } from "@/lib/formatters"
import { isValidPeriodo } from "@/lib/security/validators"
import { currentPeriodo, nowBogota } from "@/lib/periodo"

const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/

function isValidFecha(f: string | null | undefined): f is string {
  return typeof f === "string" && DATE_RE.test(f)
}

function monthBounds(month: string): { from: string; to: string } {
  const [y, m] = month.split("-").map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  const mm = String(m).padStart(2, "0")
  return { from: `${y}-${mm}-01`, to: `${y}-${mm}-${String(lastDay).padStart(2, "0")}` }
}

function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number)
  const raw = new Date(y, m - 1, 1).toLocaleDateString("es-CO", { month: "long", year: "numeric" })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

function prevMonth(month: string): string {
  const [y, m] = month.split("-").map(Number)
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`
}

function todayStr(): string {
  const now = nowBogota()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

export type FechaPreset = "este-mes" | "mes-pasado" | "todo" | "custom"

export type FechaSelection = {
  preset: FechaPreset
  from: string
  to: string
  label: string
}

// New params (preset / desde+hasta) win; legacy ?month=YYYY-MM from Resumen's
// "Ver todos →" link is the fallback and preselects that whole month.
function resolveFecha(searchParams: {
  month?: string
  preset?: string
  desde?: string
  hasta?: string
}): FechaSelection {
  const current = currentPeriodo()
  if (searchParams.preset === "este-mes") {
    const { from, to } = monthBounds(current)
    return { preset: "este-mes", from, to, label: "Este mes" }
  }
  if (searchParams.preset === "mes-pasado") {
    const prev = prevMonth(current)
    const { from, to } = monthBounds(prev)
    return { preset: "mes-pasado", from, to, label: "Mes pasado" }
  }
  if (searchParams.preset === "todo") {
    // Truly everything: data starts 2024, upper bound is today (Bogotá).
    return { preset: "todo", from: "2000-01-01", to: todayStr(), label: "Todo el tiempo" }
  }
  if (isValidFecha(searchParams.desde) && isValidFecha(searchParams.hasta)) {
    const [from, to] =
      searchParams.desde <= searchParams.hasta
        ? [searchParams.desde, searchParams.hasta]
        : [searchParams.hasta, searchParams.desde]
    return {
      preset: "custom",
      from,
      to,
      label: `${formatDateShort(from)} – ${formatDateShort(to)}`,
    }
  }
  if (isValidPeriodo(searchParams.month)) {
    const { from, to } = monthBounds(searchParams.month)
    return { preset: "custom", from, to, label: monthLabel(searchParams.month) }
  }
  const { from, to } = monthBounds(current)
  return { preset: "este-mes", from, to, label: "Este mes" }
}

export default async function PagosPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; preset?: string; desde?: string; hasta?: string }>
}) {
  const fecha = resolveFecha(await searchParams)

  const pagos = await getPagosRange(fecha.from, fecha.to)

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Link
              href="/"
              aria-label="Volver a Resumen"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            Historial de Pagos
            <InfoTip text="Fuente: CSF ERP" />
          </span>
        }
      />
      <PagosTable data={pagos} fecha={fecha} />
    </>
  )
}
