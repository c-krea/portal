import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowRight, Download, Scale, Wallet, AlertTriangle } from "lucide-react"
import { MonthFilter } from "@/components/pagos/month-filter"
import { InfoTip } from "@/components/pagos/info-tip"
import { ProgressRing } from "@/components/resumen/progress-ring"
import { TasaMoraForm } from "@/components/mora/tasa-mora-form"
import { getResumenExtras, getResumenKPIs } from "@/lib/data/pagos"
import { getMoraData, getMoraTrendReconstruido, type MoraRow } from "@/lib/data/mora"
import { getPortfolioStats } from "@/lib/data/dashboard"
import { getEmpresaCkreaId } from "@/lib/empresa"
import { formatCOP } from "@/lib/formatters"
import { isValidPeriodo } from "@/lib/security/validators"
import { currentPeriodo } from "@/lib/periodo"

// Card colours, shared by the hero bar segments, legend and card rings.
const COLOR = {
  canon: "#4f6bed",
  cuentas: "#2ea89a",
  mora: "#8b5cf6",
  luz: "#e9a23b",
  descuentos: "#94a3b8",
} as const

// "$ 160,8 M" for the hero legend.
function formatMillones(value: number): string {
  const m = value / 1_000_000
  return `$ ${m.toLocaleString("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} M`
}

function pctOf(value: number, base: number): number {
  return base > 0 ? (value / base) * 100 : 0
}

function DownloadLink({ href, title, className }: { href: string; title: string; className: string }) {
  return (
    <a href={href} download title={title} className={`inline-flex ${className}`}>
      <Download className="h-5 w-5" />
    </a>
  )
}

type KpiCardProps = {
  title: string
  titleClassName: string
  value: number
  negative?: boolean
  download?: { href: string; title: string; className: string }
  // With a proyectado: "de $X proyectado", "Faltan $Y" and a ring.
  // Without: `note` explains why, and there is no ring.
  proyectado?: { total: number; color: string }
  note?: ReactNode
}

function KpiCard({ title, titleClassName, value, negative, download, proyectado, note }: KpiCardProps) {
  const faltan = proyectado ? Math.max(0, proyectado.total - value) : 0
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold uppercase tracking-wider ${titleClassName}`}>{title}</p>
        <div className="mt-2 flex items-center gap-3">
          <p className="truncate text-2xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-[32px]">
            {negative && value > 0 ? "−" : ""}
            {formatCOP(value)}
          </p>
          {download && <DownloadLink {...download} />}
        </div>
        {proyectado ? (
          <>
            <p className="mt-1 text-sm text-slate-500">
              de <span className="font-semibold text-slate-700">{formatCOP(proyectado.total)}</span> proyectado
            </p>
            <div className="mt-4 border-t border-dashed border-slate-200 pt-3 text-sm text-slate-600">
              Faltan <span className="font-semibold text-slate-900">{formatCOP(faltan)}</span>
            </div>
          </>
        ) : note ? (
          <div className="mt-4 border-t border-dashed border-slate-200 pt-3 text-sm text-slate-500">{note}</div>
        ) : null}
      </div>
      {proyectado && <ProgressRing pct={pctOf(value, proyectado.total)} color={proyectado.color} />}
    </div>
  )
}

export default async function ResumenPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month: rawMonth } = await searchParams
  const month = isValidPeriodo(rawMonth) ? rawMonth : currentPeriodo()

  const empresaId = await getEmpresaCkreaId()
  const [kpis, extras, portfolio, moraTrend, moraData] = await Promise.all([
    getResumenKPIs(month),
    getResumenExtras(month),
    getPortfolioStats(empresaId),
    // Balance at the END of the selected month, rebuilt like the /mora trend.
    getMoraTrendReconstruido(empresaId),
    // Detalle de mora + cartera jurídica: same data as /mora (live, not per month).
    getMoraData(),
  ])

  // Canon / Mora: unchanged definitions from the previous Resumen (getResumenKPIs).
  const canon = kpis.recaudoFacturado
  const canonProyectado = kpis.facturacionMes
  const mora = kpis.recaudoMora
  const pendienteMora = moraTrend.find((p) => p.periodo === month)?.saldoVencido ?? 0
  const moraProyectado = mora + pendienteMora
  // Cuentas de cobro: not wired yet — shown as 0 on purpose.
  const cuentas = 0
  const cuentasProyectado = 0
  const luz = extras.luz
  const luzProyectado = extras.luzProyectado
  const descuentos = extras.descuentoFinanciero + extras.descuentoComercial

  const totalRecaudo = canon + mora + cuentas + luz
  const proyectado = canonProyectado + moraProyectado + cuentasProyectado + luzProyectado
  const conProyectado = canon + mora + cuentas + luz
  const cumplimiento = pctOf(conProyectado, proyectado)
  const faltanTotal = Math.max(0, proyectado - conProyectado)

  // Hero bar: segments scaled to the proyectado (or the total, if larger).
  const escala = Math.max(proyectado, totalRecaudo, 1)
  const segmentos = [
    { key: "canon", label: "Canon", value: canon, color: COLOR.canon },
    { key: "mora", label: "Mora", value: mora, color: COLOR.mora },
    { key: "luz", label: "Luz", value: luz, color: COLOR.luz },
    { key: "cuentas", label: "Cuentas de cobro", value: cuentas, color: COLOR.cuentas },
  ]

  const ocupacionPct = Math.round(pctOf(portfolio.activeClients, portfolio.totalUnits))
  const filasMora: MoraRow[] = [...moraData.activos].sort((a, b) => b.saldoVencido - a.saldoVencido)
  const totalAPagar = (r: MoraRow) => r.saldoVencido + r.interes + r.carteraCorriente
  const sumMora = (f: (r: MoraRow) => number) => filasMora.reduce((s, r) => s + f(r), 0)
  const juridica = moraData.juridica

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
          Resumen — <MonthFilter selected={month} />
        </h1>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm text-slate-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {portfolio.activeClients} de {portfolio.totalUnits} ocupados
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            {ocupacionPct}%
          </span>
        </span>
      </div>

      {/* Hero: recaudo total + composition bar */}
      <div className="mb-5 grid grid-cols-1 gap-6 rounded-2xl border border-slate-200 bg-white p-6 lg:grid-cols-[2fr_5fr]">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-slate-500">
            <Wallet className="h-3.5 w-3.5" />
            Recaudo total
            <InfoTip text="Canon + mora + luz + cuentas de cobro del mes, comparado con lo proyectado de cada línea. Luz proyectada: kWh × tarifa del mes anterior por local; mientras no se registran (hacia el día 10), usa los del mes previo." />
          </p>
          <a
            href={`/api/resumen/recaudo?periodo=${month}`}
            download
            title="Descargar recaudo del mes (Excel)"
            className="mt-2 block text-4xl font-bold tabular-nums tracking-tight text-[#2b3fae] hover:underline sm:text-[44px]"
          >
            {formatCOP(totalRecaudo)}
          </a>
          <p className="mt-1 text-sm text-slate-600">
            de <span className="font-semibold text-slate-800">{formatCOP(proyectado)}</span> proyectado
          </p>
          <div className="mt-4 flex flex-col items-start gap-2">
            <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
              {Math.round(cumplimiento)}% de cumplimiento
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
              Faltan <span className="font-semibold text-slate-800">{formatCOP(faltanTotal)}</span>
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-col justify-center">
          <div className="mb-3 flex items-center justify-between text-sm text-slate-500">
            <span>¿De dónde viene lo recaudado?</span>
            <span>Meta | 100%</span>
          </div>
          <div className="relative h-8 w-full overflow-hidden rounded-md bg-slate-100">
            <div className="flex h-full">
              {segmentos.map((s) =>
                s.value > 0 ? (
                  <div
                    key={s.key}
                    title={`${s.label}: ${formatCOP(s.value)}`}
                    style={{ width: `${(s.value / escala) * 100}%`, backgroundColor: s.color }}
                  />
                ) : null,
              )}
            </div>
            {[25, 50, 75].map((t) => (
              <span key={t} className="absolute inset-y-0 w-px bg-white/70" style={{ left: `${t}%` }} />
            ))}
            <span
              className="absolute inset-y-0 w-0.5 bg-slate-900"
              style={{ left: `calc(${(proyectado / escala) * 100}% - 2px)` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-400">
            <span>$0</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>{formatMillones(escala)}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
            {segmentos.map((s) => (
              <span key={s.key} className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: s.color }} />
                {s.label} <span className="font-semibold text-slate-900">{formatMillones(s.value)}</span>
              </span>
            ))}
            <span className="inline-flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-sm"
                style={{ background: `repeating-linear-gradient(45deg, ${COLOR.descuentos} 0 2px, transparent 2px 4px)` }}
              />
              Descuentos <span className="font-semibold text-slate-900">−{formatMillones(descuentos)}</span>
              <InfoTip text="Ya están descontados del recaudo: no se restan otra vez del total." />
            </span>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          title="Canon"
          titleClassName="text-[#4f6bed]"
          value={canon}
          download={{
            href: `/api/resumen/recaudo?periodo=${month}`,
            title: "Descargar recaudo del mes (Excel)",
            className: "text-[#4f6bed] hover:opacity-80",
          }}
          proyectado={{ total: canonProyectado, color: COLOR.canon }}
        />
        <KpiCard
          title="Cuentas de cobro"
          titleClassName="text-[#2ea89a]"
          value={cuentas}
          proyectado={{ total: cuentasProyectado, color: COLOR.cuentas }}
        />
        <KpiCard
          title="Mora"
          titleClassName="text-[#8b5cf6]"
          value={mora}
          download={{
            href: `/api/resumen/mora?periodo=${month}`,
            title: "Descargar detalle de mora del mes (Excel)",
            className: "text-[#8b5cf6] hover:opacity-80",
          }}
          proyectado={{ total: moraProyectado, color: COLOR.mora }}
        />
        <KpiCard
          title="Luz"
          titleClassName="text-[#e9a23b]"
          value={luz}
          download={{
            href: `/api/resumen/recaudo?periodo=${month}`,
            title: "Descargar recaudo del mes, incluye servicios públicos (Excel)",
            className: "text-[#e9a23b] hover:opacity-80",
          }}
          proyectado={{ total: luzProyectado, color: COLOR.luz }}
        />
        <KpiCard
          title="Depósito"
          titleClassName="text-slate-500"
          value={extras.deposito}
        />

        {/* Desglose de descuentos */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-slate-200 pb-3">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Desglose de descuentos</p>
            <p className="text-sm font-semibold tabular-nums text-slate-700">−{formatCOP(descuentos)}</p>
          </div>
          <div className="divide-y divide-dashed divide-slate-200">
            <div className="flex items-center justify-between gap-3 py-4">
              <div>
                <p className="font-semibold text-slate-900">Financieros</p>
                <p className="text-sm text-slate-500">Pronto Pago del recaudo</p>
                <p className="text-xs text-slate-400">Clientes que pagan en los primeros 10 días del mes</p>
              </div>
              <p className="text-lg font-bold tabular-nums text-slate-900 sm:text-xl">
                −{formatCOP(extras.descuentoFinanciero)}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 py-4">
              <div>
                <p className="flex items-center gap-1.5 font-semibold text-slate-900">
                  Comerciales
                  <InfoTip text="Canon × % de descuento de los contratos activos hoy. Para meses pasados usa los contratos actuales." />
                </p>
                <p className="text-sm text-slate-500">Pactados en contrato</p>
              </div>
              <p className="text-lg font-bold tabular-nums text-slate-900 sm:text-xl">
                −{formatCOP(extras.descuentoComercial)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detalle de mora + cartera jurídica (same data as /mora) */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[2fr_1fr]">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                Detalle de mora
              </h2>
              {/* Same Tasa DIAN control as /mora — editable from here too. */}
              <TasaMoraForm
                periodo={moraData.summary.periodo}
                tasaEa={moraData.summary.tasaEa}
                tasaPeriodo={moraData.summary.tasaPeriodo}
                align="left"
              />
            </div>
            <Link href="/mora" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
              Ver todos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3">Arrendatario</th>
                  <th className="px-3 py-3 text-right">Días mora</th>
                  <th className="px-3 py-3 text-right">Facturas</th>
                  <th className="px-3 py-3 text-right">Saldo vencido</th>
                  <th className="px-3 py-3 text-right">Interés</th>
                  <th className="px-3 py-3 text-right">Cartera corriente</th>
                  <th className="px-5 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filasMora.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-6 text-center text-slate-400">
                      Sin arrendatarios en mora
                    </td>
                  </tr>
                ) : (
                  filasMora.map((r) => (
                    <tr key={r.tenantId} className="hover:bg-slate-50">
                      <td className="max-w-0 truncate px-5 py-2.5 font-medium text-slate-800">
                        {r.cliente}
                        {r.unitNumber && <span className="ml-2 text-xs font-normal text-slate-400">Local {r.unitNumber}</span>}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-slate-600">{r.diasMora}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-slate-600">{r.facturas}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900">
                        {formatCOP(r.saldoVencido)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-slate-600">
                        {formatCOP(r.interes)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-slate-600">
                        {formatCOP(r.carteraCorriente)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-2.5 text-right font-semibold tabular-nums text-slate-900">
                        {formatCOP(totalAPagar(r))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filasMora.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50/60 font-semibold text-slate-900">
                    <td className="px-5 py-3">Total · {filasMora.length} arrendatarios</td>
                    <td className="px-3 py-3" />
                    <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">{sumMora((r) => r.facturas)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">{formatCOP(sumMora((r) => r.saldoVencido))}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">{formatCOP(sumMora((r) => r.interes))}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">{formatCOP(sumMora((r) => r.carteraCorriente))}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums">{formatCOP(sumMora(totalAPagar))}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Scale className="h-4 w-4 text-slate-500" />
              Cartera jurídica
            </h2>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                juridica.length > 0 ? "bg-orange-50 text-orange-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              {juridica.length > 0 ? "Activo" : "Sin registros"}
            </span>
          </div>
          <div className="p-4">
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <span className="mr-2 text-orange-600">01</span>Cartera jurídica actual
            </p>
            {juridica.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-slate-500">
                No hay cartera jurídica. No hay facturas vencidas de C-Krea en cobro jurídico (cartera zona Z99).
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {juridica.map((r) => (
                  <li key={r.tenantId} className="flex items-center justify-between gap-3 px-3 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-800">{r.cliente}</p>
                      <p className="text-xs text-slate-500">
                        {r.diasMora} días · {r.facturas} {r.facturas === 1 ? "factura" : "facturas"}
                      </p>
                    </div>
                    <p className="whitespace-nowrap font-semibold tabular-nums text-slate-900">{formatCOP(r.saldoVencido)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
