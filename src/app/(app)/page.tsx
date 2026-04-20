export const dynamic = "force-dynamic"

import { PageHeader } from "@/components/layout/page-header"
import { RecaudoCard } from "@/components/dashboard/recaudo-card"
import { getDashboardData } from "@/lib/data/dashboard"
import { formatCOP, formatPercent } from "@/lib/formatters"
import { AlertTriangle, TrendingUp, Clock, Flame } from "lucide-react"

export default async function DashboardPage() {
  const { portfolio, mora, chart } = await getDashboardData()

  const moraRatio =
    portfolio.activeClients > 0
      ? Math.round((mora.clientesEnMora / portfolio.activeClients) * 100)
      : 0

  const totalRecaudado = chart.reduce((s, r) => s + r.recaudado, 0)
  const metaPercent =
    portfolio.portfolioTotal > 0
      ? Math.round((totalRecaudado / portfolio.portfolioTotal) * 100)
      : 0

  const desglose = [
    {
      icon: Flame,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-500",
      label: "Mora Crítica",
      value: formatCOP(mora.moraCritica),
      subtext: "Más de 2 meses",
    },
    {
      icon: AlertTriangle,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-500",
      label: "Mora Activa",
      value: formatCOP(mora.moraActiva),
      subtext: "1 a 2 meses",
    },
    {
      icon: TrendingUp,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-500",
      label: "Intereses",
      value: formatCOP(mora.totalInteres),
      subtext: "Acumulados por mora",
    },
    {
      icon: Clock,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
      label: "Promedio de Días",
      value: `${mora.avgDiasMora} días`,
      subtext: "En mora",
    },
  ]

  return (
    <>
      <PageHeader title="Resumen del Portafolio" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Recaudo Proyectado 2026
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatCOP(portfolio.portfolioTotal)}
          </p>
          <p className="mt-1 text-xs text-emerald-600">
            {portfolio.activeClients} contratos activos · c/IVA
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${metaPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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
      <div className="mt-4 flex flex-col lg:flex-row gap-4">
        {/* Desglose */}
        <div className="flex h-auto lg:h-[480px] w-full lg:w-[350px] shrink-0 flex-col rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <p className="shrink-0 text-sm font-semibold text-slate-900">Desglose de Mora</p>
          <div className="mt-3 flex min-h-0 flex-1 flex-col">
            {desglose.map(({ icon: Icon, iconBg, iconColor, label, value, subtext }, idx) => (
              <div
                key={label}
                className={`flex flex-1 items-center gap-4 ${idx < desglose.length - 1 ? "border-b border-slate-100" : ""}`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium uppercase tracking-wider text-slate-500 text-[clamp(0.6rem,1.3vh,0.8rem)]">{label}</p>
                  <p className="font-bold text-slate-900 text-[clamp(1rem,3.2vh,2.25rem)] leading-tight">{value}</p>
                  <p className="text-slate-400 text-[clamp(0.6rem,1.1vh,0.75rem)]">{subtext}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart — fills remaining width */}
        <RecaudoCard data={chart} />
      </div>
    </>
  )
}
