import { PageHeader } from "@/components/layout/page-header"
import { GastosExpenseTable, type GastoExpenseLine } from "@/components/gastos/gastos-expense-table"
import { GastosTendenciaChart } from "@/components/gastos/gastos-tendencia-chart"
import { GastosDistribucionChart } from "@/components/gastos/gastos-distribucion-chart"
import { PeriodoDropdown } from "@/components/layout/periodo-dropdown"
import { CAT_COLORS } from "@/components/gastos/cat-colors"
import { InfoTip } from "@/components/pagos/info-tip"
import { getGastoRows, getGastoSummary, getGastosForPeriodo, getGastoPeriodos, getGastosHistorico, isValidPeriodo } from "@/lib/data/gastos"
import { isValidYear } from "@/lib/security/validators"
import { formatCOP } from "@/lib/formatters"
import { Calculator, Receipt } from "lucide-react"

const MONTH_RE = /^(0[1-9]|1[0-2])$/

const MES_FULL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

function fullMesLabel(p: string): string {
  const [y, m] = p.split("-")
  const idx = Number(m) - 1
  if (idx < 0 || idx > 11) return p
  return `${MES_FULL[idx]} ${y}`
}

// Labels match CAT_LABEL in src/lib/data/gastos.ts (kept local so that file's
// classification logic stays untouched). Keys match GastoChartRow fields.
const CATS: { key: "vigilancia" | "reparaciones" | "nomina" | "servicios_publicos" | "aseo_cafeteria" | "publicidad" | "impuestos" | "otros"; label: string }[] = [
  { key: "vigilancia",         label: "Vigilancia"         },
  { key: "nomina",             label: "Nómina"             },
  { key: "servicios_publicos", label: "Servicios Públicos" },
  { key: "aseo_cafeteria",     label: "Aseo y Cafetería"   },
  { key: "publicidad",         label: "Publicidad"         },
  { key: "reparaciones",       label: "Reparaciones"       },
  { key: "impuestos",          label: "Impuestos"          },
  { key: "otros",              label: "Otros"              },
]

export default async function GastosPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; periodo?: string }>
}) {
  const { year: yearParam, month: monthParam, periodo: periodoParam } = await searchParams
  const periodos = await getGastoPeriodos()
  const fallback = periodos[0]?.value ?? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`

  let periodo: string
  if (yearParam && isValidYear(yearParam) && monthParam && MONTH_RE.test(monthParam)) {
    const candidate = `${yearParam}-${monthParam}`
    periodo = periodos.some((p) => p.value === candidate) ? candidate : fallback
  } else if (periodoParam && isValidPeriodo(periodoParam)) {
    periodo = periodoParam
  } else {
    periodo = fallback
  }

  const [selectedYear] = periodo.split("-")

  const [rows, summary, monthData, historico] = await Promise.all([
    getGastoRows(periodo),
    getGastoSummary(selectedYear),
    getGastosForPeriodo(periodo),
    getGastosHistorico(periodo, 5),
  ])

  const mesLabel = fullMesLabel(periodo)

  const tendencia = historico.map((h) => ({ periodo: h.periodo, total: h.total }))

  const distribucion = CATS
    .map(({ key, label }) => ({ name: label, value: monthData[key], fill: CAT_COLORS[key] ?? "#94a3b8" }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)

  const expenses: GastoExpenseLine[] = rows.flatMap((r) =>
    r.details.map((d) => ({
      name: d.name,
      amount: d.amount,
      category: r.category,
      gastoTypeName: r.gastoTypeName,
    })),
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title="Gastos">
        <PeriodoDropdown periodos={periodos} periodo={periodo} basePath="/gastos" />
      </PageHeader>

      {/* ── KPI hero cards ── */}
      <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-50">
              <Receipt className="h-6 w-6 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-slate-500">
                {mesLabel}
                <InfoTip text="Total de gastos causados este mes, todas las categorías." />
              </p>
              <p className="text-3xl font-bold text-slate-900 tabular-nums truncate">{formatCOP(monthData.total)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-50">
              <Calculator className="h-6 w-6 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-slate-500">
                Total mensual
                <InfoTip text={`Promedio mensual acumulado en ${selectedYear} · ${summary.totalMeses} meses con datos.`} />
              </p>
              <p className="text-3xl font-bold text-slate-900 tabular-nums truncate">{formatCOP(summary.avgMensual)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Chart row — fixed, generous height (most important content on the
          page); NOT flex-grow, so it can't balloon and push everything else
          off-screen the way the earlier proportional-split attempt did. ── */}
      <div className="mt-3 grid h-[300px] shrink-0 grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-[10px] border border-slate-200 bg-white">
          <h2 className="shrink-0 border-b border-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-900">
            Tendencia de gastos
          </h2>
          <div className="flex-1 px-2 py-2">
            <GastosTendenciaChart data={tendencia} />
          </div>
        </div>
        <div className="flex flex-col overflow-hidden rounded-[10px] border border-slate-200 bg-white">
          <h2 className="shrink-0 border-b border-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-900">
            Distribución — {mesLabel}
          </h2>
          <div className="flex flex-1 items-center justify-center p-4">
            <GastosDistribucionChart data={distribucion} />
          </div>
        </div>
      </div>

      {/* ── Flat expense table — secondary; takes whatever's left, less than
          the charts above. Its own component caps rows so it never needs
          internal scroll either (see DEFAULT_PAGE_SIZE there). ── */}
      <div className="mt-3 min-h-0 flex-1">
        <GastosExpenseTable data={expenses} />
      </div>
    </div>
  )
}
