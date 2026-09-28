import Link from "next/link"
import { Info } from "lucide-react"
import { MonthFilter } from "@/components/pagos/month-filter"
import { getPagos, getResumenKPIs } from "@/lib/data/pagos"
import { getMoraTrendReconstruido } from "@/lib/data/mora"
import { classifyPagoBucket } from "@/lib/pago-bucket"
import { getPortfolioStats } from "@/lib/data/dashboard"
import { getEmpresaCkreaId } from "@/lib/empresa"
import { formatCOP, formatDateShort } from "@/lib/formatters"
import { isValidPeriodo } from "@/lib/security/validators"
import { currentPeriodo } from "@/lib/periodo"
import {
  OrigenChart,
  SemanalChart,
  type OrigenDatum,
  type SemanaDatum,
} from "@/components/resumen/resumen-charts"

// Row-level Estado shares the single classifier in src/lib/pago-bucket.ts
// (same rule as the SQL CASE in getPagosBuckets): mora iff
// fecha_recaudo > fecha_factura + 30, else Al día.

const ESTADO_META = {
  al_dia: { dot: "bg-emerald-500", label: "Al día" },
  mora: { dot: "bg-rose-500", label: "Mora" },
} as const

// Native `title` needs the cursor to sit dead still for ~1s before it shows —
// too easy to never trigger. Instant custom tooltip on hover instead.
function InfoTip({ text, iconClassName = "text-slate-400" }: { text: string; iconClassName?: string }) {
  return (
    <span className="group relative inline-flex cursor-help">
      <Info className={`h-3.5 w-3.5 ${iconClassName}`} />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-56 -translate-x-1/2 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-[11px] leading-snug text-slate-600 shadow-lg group-hover:block">
        {text}
      </span>
    </span>
  )
}

export default async function ResumenPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month: rawMonth } = await searchParams
  const month = isValidPeriodo(rawMonth) ? rawMonth : currentPeriodo()
  const [yy, mm] = month.split("-").map(Number)

  const empresaId = await getEmpresaCkreaId()
  const [kpis, pagos, portfolio, moraTrend] = await Promise.all([
    getResumenKPIs(month),
    getPagos(month),
    getPortfolioStats(empresaId),
    // Mora denominator: balance at the START of the selected month, rebuilt the
    // same way as the /mora trend (still open today + paid after that date).
    // Shared code, not a second definition — every month the picker offers is
    // inside the reconstructed series. The series points at each month's END,
    // so this month's opening balance is the PREVIOUS month's point.
    getMoraTrendReconstruido(empresaId),
  ])

  const facturacionMes = kpis.facturacionMes
  const recaudoFacturado = kpis.recaudoFacturado
  const recaudoMora = kpis.recaudoMora
  // The two added — totalRecaudo is derived as this sum inside getResumenKPIs,
  // so cards 1+2 == card 3 holds by construction for every month.
  const totalRecaudo = kpis.totalRecaudo
  const mesAnterior = `${mm === 1 ? yy - 1 : yy}-${String(mm === 1 ? 12 : mm - 1).padStart(2, "0")}`
  const moraInicio = moraTrend.find((p) => p.periodo === mesAnterior)?.saldoVencido ?? 0
  const pendiente = Math.max(0, facturacionMes - recaudoFacturado)
  const pctFacturacion = facturacionMes > 0 ? Math.round((recaudoFacturado / facturacionMes) * 100) : 0
  const pctMora = moraInicio > 0 ? Math.round((recaudoMora / moraInicio) * 100) : 0

  const decenas: SemanaDatum[] = [
    { semana: "1–10", total: kpis.decena1, fill: "#10b981" },
    { semana: "11–20", total: kpis.decena2, fill: "#1e40af" },
    { semana: "21–fin", total: kpis.decena3, fill: "#94a3b8" },
  ]

  // Mora never appears here: it is other months' money and lives on its own card.
  // Zero slices next to paddingAngle corrupt the pie render — filter them out.
  const origen: OrigenDatum[] = [
    { name: "Recaudo", value: recaudoFacturado, fill: "#1e40af" },
    { name: "Pendiente", value: pendiente, fill: "#cbd5e1" },
  ].filter((d) => d.value > 0)

  const ultimos = pagos.slice(0, 8)

  const mesRaw = new Date(yy, mm - 1, 1).toLocaleDateString("es-CO", { month: "long" })
  const mesTitulo = `${mesRaw.charAt(0).toUpperCase() + mesRaw.slice(1)} ${yy}`

  return (
    <>
      {/* Header: title + month picker + two pill chips */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-1.5 text-xl font-bold tracking-tight text-slate-900">
          Resumen — <MonthFilter selected={month} />
        </h1>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
            <span className="text-slate-500">Facturación del mes</span>
            <InfoTip text="Lo que Siesa facturó de arriendo este mes. No cambia con tu cobro." />
            <span className="font-semibold tabular-nums text-slate-900">
              {formatCOP(facturacionMes)}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {portfolio.activeClients} de {portfolio.totalUnits} ocupados
          </span>
        </div>
      </div>

      {/* 3 hero KPI tiles: number on top, title + InfoTip underneath */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-[10px] border border-slate-200 bg-white p-4">
          <p className="text-[26px] font-bold leading-tight tracking-tight tabular-nums text-slate-900">
            {formatCOP(recaudoFacturado)}{" "}
            <span className="align-middle text-sm font-semibold text-slate-400">
              ({pctFacturacion}%)
            </span>
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Recaudo facturado
            <InfoTip text="Pagos hechos dentro de los 30 días de su propia factura. % sobre la facturación del mes. Si el mes va corriendo, el % sube hasta cerrar." />
          </p>
        </div>
        <div className="rounded-[10px] border border-slate-200 bg-white p-4">
          <p className="text-[26px] font-bold leading-tight tracking-tight tabular-nums text-slate-900">
            {formatCOP(recaudoMora)}{" "}
            <span className="align-middle text-sm font-semibold text-slate-400">
              ({pctMora}%)
            </span>
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Recaudo mora
            <InfoTip text="Pagos hechos después de los 30 días, ya con intereses. % sobre la mora al inicio del mes. Sin cartera jurídica." />
          </p>
        </div>
        <div className="rounded-[10px] border border-blue-100 bg-blue-50/40 p-4">
          <p className="text-[26px] font-bold leading-tight tracking-tight tabular-nums text-blue-700">
            {formatCOP(totalRecaudo)}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700">
            Total recaudo
            <InfoTip
              text="Toda la caja del mes: al día más mora. Sin porcentaje — mezcla facturas de varios meses."
              iconClassName="text-blue-700/50"
            />
          </p>
        </div>
      </div>

      {/* Chart row */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-[10px] border border-slate-200 bg-white">
          <h2 className="flex items-center gap-1.5 border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
            Recaudo por decena — {mesTitulo}
            <InfoTip text="Días 1–10 es la ventana de pronto pago: lo que entra ahí alcanzó el descuento." />
          </h2>
          <div className="px-2 py-3">
            <SemanalChart data={decenas} />
          </div>
        </div>
        <div className="flex flex-col overflow-hidden rounded-[10px] border border-slate-200 bg-white">
          <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
            Origen del recaudo
          </h2>
          <div className="flex flex-1 items-center p-6">
            <OrigenChart data={origen} />
          </div>
        </div>
      </div>

      {/* Table: max 8 rows */}
      <div className="overflow-hidden rounded-[10px] border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Pagos del mes</h2>
          <Link
            href={`/pagos?month=${month}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Ver todos →
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Local</th>
              <th className="px-4 py-2">Inquilino</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {ultimos.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-sm text-slate-400">
                  Sin pagos este mes
                </td>
              </tr>
            ) : (
              ultimos.map((p) => {
                const estado = classifyPagoBucket(p)
                const meta = ESTADO_META[estado]
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-2 text-slate-600">
                      {formatDateShort(p.fechaRecaudo)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-slate-600">
                      {p.unitNumber ?? "—"}
                    </td>
                    <td className="max-w-0 truncate px-4 py-2 font-medium text-slate-800">
                      {p.clienteName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">
                      <span className="inline-flex items-center gap-1.5 text-slate-600">
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-right font-semibold tabular-nums text-slate-900">
                      {formatCOP(p.valorFinal)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
