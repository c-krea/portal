import { PageHeader } from "@/components/layout/page-header"
import { RecaudoCard } from "@/components/dashboard/recaudo-card"
import { getDashboardData } from "@/lib/data/dashboard"
import { formatCOP, formatPercent } from "@/lib/formatters"
import { AlertTriangle, TrendingUp, Clock, Flame } from "lucide-react"

export default async function DashboardPage() {
  const { portfolio, mora, totalRecaudado, chart, computedAt } = await getDashboardData()

  const occupancyPercent =
    portfolio.totalUnits > 0
      ? Math.round((portfolio.activeClients / portfolio.totalUnits) * 100)
      : 0

  const moraRatio =
    portfolio.activeClients > 0
      ? Math.round((mora.clientesEnMora / portfolio.activeClients) * 100)
      : 0

  // Cash-only: KPI shows recaudado neto (money in bank). PP otorgado kept as
  // sub-detail. Meta % compares cash vs piso — piso already nets PP out, so
  // adding PP back would double-count.
  const cashRecaudado = totalRecaudado.recaudado
  const metaPercent =
    portfolio.portfolioTotal > 0
      ? Math.round((cashRecaudado / portfolio.portfolioTotal) * 100)
      : 0

  const desglose = [
    {
      icon: Flame,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-500",
      label: "Mora Crítica",
      value: mora.moraCritica > 0 ? formatCOP(mora.moraCritica) : "—",
      subtext: mora.moraCritica > 0 ? "Más de 60 días" : "Sin mora crítica",
    },
    {
      icon: AlertTriangle,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-500",
      label: "Mora Activa",
      value: mora.moraActiva > 0 ? formatCOP(mora.moraActiva) : "—",
      subtext: mora.moraActiva > 0 ? "Hasta 60 días" : "Sin mora activa",
    },
    {
      icon: TrendingUp,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-500",
      label: "Intereses",
      value: mora.totalInteres > 0 ? formatCOP(mora.totalInteres) : "—",
      subtext: "Acumulados por mora",
    },
    {
      icon: Clock,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
      label: "Promedio de Días",
      value: mora.clientesEnMora > 0 ? `${mora.avgDiasMora} días` : "—",
      subtext: mora.clientesEnMora > 0 ? "En mora" : "Sin clientes en mora",
    },
  ]

  // Reflects when the cached data was actually computed (not render time), so the
  // "Datos al …" footer never claims fresher than the 30-min cache really is.
  const lastSync = new Date(computedAt).toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  })

  return (
    <>
      <PageHeader title="Resumen del Portafolio" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <section
          aria-labelledby="kpi-proyectado"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 id="kpi-proyectado" className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Recaudo Proyectado 2026
          </h2>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatCOP(portfolio.portfolioTotal)}
          </p>
          <p className="mt-1 text-xs text-emerald-600">
            Piso realista c/IVA
          </p>
        </section>

        <section
          aria-labelledby="kpi-recaudado"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 id="kpi-recaudado" className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Total Recaudado
          </h2>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatCOP(cashRecaudado)}
          </p>
          <div className="mt-2 space-y-1">
            <p className="text-xs text-slate-500">
              {formatPercent(metaPercent, 0)} alcanzado
            </p>
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${Math.min(metaPercent, 100)}%` }}
              />
            </div>
          </div>
        </section>

        <section
          aria-labelledby="kpi-mora"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 id="kpi-mora" className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Clientes en Mora
          </h2>
          <p className="mt-1 text-2xl font-bold text-rose-500">
            {mora.clientesEnMora}
            <span className="ml-1 text-sm font-normal text-slate-500">
              / {portfolio.activeClients}
            </span>
          </p>
          <div className="mt-2 space-y-1">
            <p className="text-xs text-slate-500">{moraRatio}% del portafolio</p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-rose-500"
                style={{ width: `${moraRatio}%` }}
              />
            </div>
          </div>
        </section>

        <section
          aria-labelledby="kpi-ocupacion"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 id="kpi-ocupacion" className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Ocupación
          </h2>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {occupancyPercent}%
          </p>
          <div className="mt-2 space-y-1">
            <p className="text-xs text-slate-500">
              {portfolio.activeClients} de {portfolio.totalUnits} locales ocupados
            </p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${occupancyPercent}%` }}
              />
            </div>
          </div>
        </section>
      </div>

      {/* Bottom row */}
      <div className="mt-4 flex flex-col lg:flex-row gap-4">
        {/* Desglose */}
        <section
          aria-labelledby="desglose-mora"
          className="flex h-auto lg:h-[480px] w-full lg:w-[350px] shrink-0 flex-col rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm"
        >
          <h2 id="desglose-mora" className="shrink-0 text-sm font-semibold text-slate-900">Desglose de Mora</h2>
          <div className="mt-3 flex min-h-0 flex-1 flex-col">
            {desglose.map(({ icon: Icon, iconBg, iconColor, label, value, subtext }, idx) => (
              <div
                key={label}
                className={`flex items-center gap-4 py-4 lg:flex-1 lg:py-0 ${idx < desglose.length - 1 ? "border-b border-slate-100" : ""}`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-600">{label}</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">{value}</p>
                  <p className="text-xs text-slate-500">{subtext}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Chart — fills remaining width */}
        <RecaudoCard data={chart} />
      </div>

      <p className="mt-3 text-right text-[10px] text-slate-400">
        Datos al {lastSync}
      </p>
    </>
  )
}
