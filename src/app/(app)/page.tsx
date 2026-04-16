import { PageHeader } from "@/components/layout/page-header"
import { RendimientoChart } from "@/components/dashboard/rendimiento-chart"
import { getDashboardData } from "@/lib/data/dashboard"
import { formatCOP, formatPercent } from "@/lib/formatters"
import { AlertTriangle, TrendingUp, Clock, Calendar } from "lucide-react"

export default async function DashboardPage() {
  const { portfolio, mora, chart } = await getDashboardData()

  const moraRatio =
    portfolio.activeClients > 0
      ? Math.round((mora.clientesEnMora / portfolio.activeClients) * 100)
      : 0

  // placeholder — replace with real recaudo once payments are seeded
  const totalRecaudado = 0
  const metaPercent =
    portfolio.portfolioTotal > 0
      ? Math.round((totalRecaudado / portfolio.portfolioTotal) * 100)
      : 0

  const desglose = [
    {
      icon: AlertTriangle,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-500",
      label: "Total en Mora",
      value: formatCOP(mora.totalMora),
      subtext: `${mora.clientesEnMora} clientes`,
    },
    {
      icon: TrendingUp,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-500",
      label: "Intereses Acumulados",
      value: formatCOP(mora.totalInteres),
      subtext: "Por mora",
    },
    {
      icon: Clock,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-500",
      label: "Prom. Días en Mora",
      value: `${mora.avgDiasMora} días`,
      subtext: "Promedio general",
    },
    {
      icon: Calendar,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
      label: "Saldo Total Cartera",
      value: formatCOP(mora.totalSaldo),
      subtext: "Cartera activa",
    },
  ]

  return (
    <>
      <PageHeader title="Resumen del Portafolio">
        <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
          <option>Todos los Proyectos</option>
          <option>Central Kreativa</option>
        </select>
        <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
          <option>Todos los Estados</option>
          <option>Al día</option>
          <option>En mora</option>
          <option>Crítico</option>
        </select>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Portafolio Total
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatCOP(portfolio.portfolioTotal)}
          </p>
          <p className="mt-1 text-xs text-emerald-600">
            {portfolio.activeClients} clientes activos
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Total Recaudado
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatCOP(totalRecaudado)}
          </p>
          <div className="mt-2 space-y-1">
            <p className="text-xs text-slate-500">
              {formatPercent(metaPercent, 0)} de la meta alcanzada
            </p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${metaPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Saldo Pendiente
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatCOP(mora.totalSaldo)}
          </p>
          <p className="mt-1 text-xs text-slate-400">Cartera total activa</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Clientes en Mora
          </p>
          <p className="mt-1 text-2xl font-bold text-rose-500">
            {mora.clientesEnMora}
            <span className="ml-1 text-sm font-normal text-slate-400">
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
        </div>
      </div>

      {/* Bottom row */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Desglose */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Desglose de Cartera</p>
          <div className="mt-4 divide-y divide-slate-100">
            {desglose.map(({ icon: Icon, iconBg, iconColor, label, value, subtext }) => (
              <div
                key={label}
                className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg}`}
                >
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    {label}
                  </p>
                  <p className="text-lg font-bold text-slate-900">{value}</p>
                  <p className="text-xs text-slate-400">{subtext}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rendimiento chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">
            Proyecciones 2026
          </p>
          <RendimientoChart data={chart} />
          <div className="mt-4 flex gap-6 border-t border-slate-100 pt-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Prom. Proyectado / Mes
              </p>
              <p className="mt-0.5 text-sm font-bold text-slate-900">
                {formatCOP(
                  chart.length > 0
                    ? chart.reduce((s, r) => s + r.proyectado, 0) / chart.length
                    : 0
                )}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Total Proyectado
              </p>
              <p className="mt-0.5 text-sm font-bold text-slate-900">
                {formatCOP(chart.reduce((s, r) => s + r.proyectado, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
