import { PageHeader } from "@/components/layout/page-header"
import { ClientesTable } from "@/components/clientes/clientes-table"
import { InfoTip } from "@/components/pagos/info-tip"
import { getClienteRows, getVacantUnitRows, getLocalesKPIs } from "@/lib/data/clientes"

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ entrada?: string }>
}) {
  const { entrada } = await searchParams

  const [rows, vacantRows, kpis] = await Promise.all([
    getClienteRows(entrada),
    getVacantUnitRows(entrada),
    getLocalesKPIs(entrada),
  ])

  const occupancyPct = kpis.totalUnits > 0
    ? ((kpis.occupiedUnits / kpis.totalUnits) * 100).toFixed(1)
    : "0"

  // Derived from the already-fetched rows — no new query. "En mora" incluye
  // en_mora + critico: critico es solo severidad (>60d) para la tabla, pero el KPI
  // debe contar a los peores deudores (antes se excluían por contar solo en_mora).
  // Percentages are a share of these occupied/active rows, same population
  // Ocupación's own percentage is drawn from.
  const alDia = rows.filter((r) => r.status === "al_dia").length
  const enMora = rows.filter((r) => r.status === "en_mora" || r.status === "critico").length
  const pctOf = (n: number) => (rows.length > 0 ? Math.round((n / rows.length) * 100) : 0)

  return (
    <>
      <PageHeader title="Locales" />

      {/* KPI Cards — same tile style as Resumen hero tiles */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Al día */}
        <div className="rounded-[10px] border border-slate-200 bg-white p-4">
          <p className="text-[1.75rem] font-bold tracking-tight tabular-nums text-slate-900">
            {alDia} <span className="align-middle text-sm font-semibold text-slate-400">({pctOf(alDia)}%)</span>
          </p>
          <p className="mt-1 text-sm text-slate-600">Locales Al Día</p>
        </div>

        {/* En mora */}
        <div className="rounded-[10px] border border-slate-200 bg-white p-4">
          <p className="text-[1.75rem] font-bold tracking-tight tabular-nums text-slate-900">
            {enMora} <span className="align-middle text-sm font-semibold text-slate-400">({pctOf(enMora)}%)</span>
          </p>
          <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
            Locales En Mora
            <InfoTip text="Solo cuenta inquilinos con contrato; el total completo está en Mora." />
          </p>
        </div>

        {/* Locales vacíos */}
        <div className="rounded-[10px] border border-slate-200 bg-white p-4">
          <p className="text-[1.75rem] font-bold tracking-tight tabular-nums text-slate-900">
            {kpis.vacantes}
          </p>
          <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
            Locales vacíos
            <InfoTip text="Locales sin contrato activo. Los demás KPI de esta fila cuentan inquilinos, no locales: un inquilino puede tener varios locales." />
          </p>
        </div>

        {/* Ocupación */}
        <div className="rounded-[10px] border border-slate-200 bg-white p-4">
          <p className="text-[1.75rem] font-bold tracking-tight tabular-nums text-slate-900">
            {kpis.occupiedUnits} / {kpis.totalUnits}{" "}
            <span className="align-middle text-sm font-semibold text-slate-400">({occupancyPct}%)</span>
          </p>
          <p className="mt-1 text-sm text-slate-600">Ocupación</p>
        </div>
      </div>

      <ClientesTable data={rows} vacantUnits={vacantRows} activeEntrada={entrada} />
    </>
  )
}
