import { PageHeader } from "@/components/layout/page-header"
import { MoraTable } from "@/components/mora/mora-table"
import { TasaMoraForm } from "@/components/mora/tasa-mora-form"
import { MoraTendenciaChart } from "@/components/mora/mora-tendencia-chart"
import { MoraUrgenciaChart } from "@/components/mora/mora-urgencia-chart"
import { InfoTip } from "@/components/pagos/info-tip"
import { getMoraData, getMoraTrendReconstruido } from "@/lib/data/mora"
import { getEmpresaCkreaId } from "@/lib/empresa"
import { formatCOP } from "@/lib/formatters"
import { AlertTriangle, Users } from "lucide-react"

export default async function MoraPage() {
  const { activos, juridica, summary } = await getMoraData()
  // Reconstructed month-start series (WOR-321): every point is the balance at
  // the 1st of its month, including the current month. The live total stays on
  // the KPI hero card above — appending it here would put two dots on the same
  // month label with different grains (month-start vs today).
  const trend = await getMoraTrendReconstruido(await getEmpresaCkreaId())

  // Urgency split (active tenants) by días mora — same cuts as the old bucket row
  const urgencia = [
    { name: "Nuevos en mora", value: activos.filter((r) => r.diasMora <= 30).length,                        fill: "#fbbf24" },
    { name: "En mora",        value: activos.filter((r) => r.diasMora > 30 && r.diasMora <= 60).length,     fill: "#fb923c" },
    { name: "Críticos",       value: activos.filter((r) => r.diasMora > 60).length,                         fill: "#f43f5e" },
  ]

  return (
    <>
      <PageHeader title="Gestión de Mora">
        <TasaMoraForm periodo={summary.periodo} tasaEa={summary.tasaEa} tasaPeriodo={summary.tasaPeriodo} />
      </PageHeader>

      {/* ── KPI hero cards (active tenants) ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-5 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-rose-50">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-slate-500">
                Total en Mora
                <InfoTip text="Saldo vencido de inquilinos activos, sin intereses. No incluye cartera jurídica." />
              </p>
              <p className="text-sm sm:text-lg font-bold text-rose-600 tabular-nums truncate">{formatCOP(summary.totalCarteraVencida)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-5 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-orange-50">
              <Users className="h-4 w-4 text-orange-500" />
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-slate-500">
                Total Clientes Mora
                <InfoTip text="Inquilinos activos con al menos una factura vencida. No incluye cartera jurídica." />
              </p>
              <p className="text-sm sm:text-lg font-bold text-orange-600 tabular-nums truncate">{summary.clientes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Chart row ── */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-[10px] border border-slate-200 bg-white">
          <h2 className="flex items-center gap-1.5 border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
            Tendencia de mora
            <InfoTip text="Saldo vencido al cierre de cada mes. El mes en curso va en vivo y coincide con el total de arriba; se congela al cerrar el mes." />
          </h2>
          <div className="px-2 py-3">
            <MoraTendenciaChart data={trend} />
          </div>
        </div>
        <div className="flex flex-col overflow-hidden rounded-[10px] border border-slate-200 bg-white">
          <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
            Urgencia de mora
          </h2>
          <div className="flex flex-1 items-center p-6">
            <MoraUrgenciaChart data={urgencia} />
          </div>
        </div>
      </div>

      {/* ── Table (active tenants) ── */}
      <div className="mt-4">
        <MoraTable data={activos} />
      </div>

      {/* ── Cartera Jurídica (separate — not in the KPI totals above) ── */}
      {/* Always shown: an empty list is a fact to record, not a missing section. */}
      <div className="mt-8">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="inline-block rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
            Cartera Jurídica
          </span>
          <InfoTip text="Inquilinos jurídicos + ex-inquilinos con saldo. No incluida en los totales ni gráficas de arriba — esta cartera ya no se gestiona por cobro directo, sino por proceso legal." />
        </div>
        {juridica.length > 0 ? (
          <MoraTable data={juridica} />
        ) : (
          <div className="rounded-[10px] border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
            No hay cartera jurídica. Ningún arrendatario marcado como jurídico tiene saldo abierto en cartera.
          </div>
        )}
      </div>
    </>
  )
}
