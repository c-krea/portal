import type { ReactNode } from "react"
import { Download, Scale, Wallet, AlertTriangle, Lock } from "lucide-react"
import { MonthFilter } from "@/components/pagos/month-filter"
import { InfoTip } from "@/components/pagos/info-tip"
import { ProgressRing } from "@/components/resumen/progress-ring"
import { TasaMoraForm } from "@/components/mora/tasa-mora-form"
import { JuridicaList, MoraDetalleTable } from "@/components/resumen/mora-detalle"
import { CuentasCobroEditor, CuentasCobroUltimoCambio } from "@/components/resumen/cuentas-cobro-editor"
import { computeResumenTotales, getResumenCierre } from "@/lib/data/resumen"
import { getCuentasCobroHistorial } from "@/lib/data/cuentas-cobro"
import { getSessionProfile } from "@/lib/auth/session"
import { getMoraData, type MoraRow } from "@/lib/data/mora"
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
  // Extra control next to the value (e.g. the cuentas de cobro editor) and a line under "Faltan".
  action?: ReactNode
  footnote?: ReactNode
}

function KpiCard({ title, titleClassName, value, negative, download, proyectado, note, action, footnote }: KpiCardProps) {
  const faltan = proyectado ? Math.max(0, proyectado.total - value) : 0
  return (
    // @container: the value's font follows the card width (cqi), so a narrow
    // card (14" laptop, 3 columns) shrinks the figure instead of cutting it.
    <div className="@container flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold uppercase tracking-wider ${titleClassName}`}>{title}</p>
        <div className="mt-2 flex items-center gap-3">
          <p
            title={formatCOP(value)}
            className="truncate text-[clamp(1.125rem,6.5cqi,2rem)] font-bold tabular-nums tracking-tight text-slate-900"
          >
            {negative && value > 0 ? "−" : ""}
            {formatCOP(value)}
          </p>
          {download && <DownloadLink {...download} />}
          {action}
        </div>
        {proyectado ? (
          <>
            <p className="mt-1 text-sm text-slate-500">
              de <span className="font-semibold text-slate-700">{formatCOP(proyectado.total)}</span> proyectado
            </p>
            <div className="mt-4 border-t border-dashed border-slate-200 pt-3 text-sm text-slate-600">
              Faltan <span className="font-semibold text-slate-900">{formatCOP(faltan)}</span>
            </div>
            {footnote && <p className="mt-1 text-xs text-slate-400">{footnote}</p>}
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
  // A closed month is read from v2.resumen_cierres_mensuales; the open month
  // (or a past month not closed yet) is computed live.
  const [cierre, portfolio, moraData, historialCuentas, profile] = await Promise.all([
    month < currentPeriodo() ? getResumenCierre(month) : Promise.resolve(null),
    getPortfolioStats(empresaId),
    // Detalle de mora + cartera jurídica (live, not per month).
    getMoraData(),
    getCuentasCobroHistorial(month),
    getSessionProfile(),
  ])
  const canEditCuentas = profile?.rol === "admin" || profile?.rol === "finanzas"
  const t = cierre?.totales ?? (await computeResumenTotales(month, { ocupacion: false }))

  const { canon, canonProyectado, mora, moraProyectado, cuentas, cuentasProyectado, luz, luzProyectado } = t
  const extras = { deposito: t.deposito, descuentoFinanciero: t.descuentoFinanciero, descuentoComercial: t.descuentoComercial }
  const descuentos = t.descuentoFinanciero + t.descuentoComercial

  const totalRecaudo = t.totalRecaudo
  const proyectado = t.totalProyectado
  const cumplimiento = pctOf(totalRecaudo, proyectado)
  const faltanTotal = Math.max(0, proyectado - totalRecaudo)
  const ocupados = t.localesOcupados ?? portfolio.activeClients
  const totalLocales = t.localesTotal ?? portfolio.totalUnits

  // Hero bar: segments scaled to the proyectado (or the total, if larger).
  const escala = Math.max(proyectado, totalRecaudo, 1)
  const segmentos = [
    { key: "canon", label: "Canon", value: canon, color: COLOR.canon },
    { key: "mora", label: "Mora", value: mora, color: COLOR.mora },
    { key: "luz", label: "Luz", value: luz, color: COLOR.luz },
    { key: "cuentas", label: "Cuentas de cobro", value: cuentas, color: COLOR.cuentas },
  ]

  const ocupacionPct = Math.round(pctOf(ocupados, totalLocales))
  const filasMora: MoraRow[] = [...moraData.activos].sort((a, b) => b.saldoVencido - a.saldoVencido)
  const juridica = moraData.juridica

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
          Resumen — <MonthFilter selected={month} />
          {cierre ? (
            <span
              title={`Cifras congeladas el ${new Date(cierre.generadoAt).toLocaleString("es-CO", { timeZone: "America/Bogota" })} (${cierre.origen})`}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
            >
              <Lock className="h-3 w-3" />
              Mes cerrado
            </span>
          ) : null}
        </h1>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm text-slate-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {ocupados} de {totalLocales} ocupados
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
            className="mt-2 block text-4xl font-bold tabular-nums tracking-tight text-[#2b3fae] hover:underline sm:text-[2.75rem]"
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
          action={
            <CuentasCobroEditor
              periodo={month}
              ejecutado={cuentas}
              proyectado={cuentasProyectado}
              historial={historialCuentas}
              canEdit={canEditCuentas}
            />
          }
          footnote={<CuentasCobroUltimoCambio cambio={historialCuentas[0]} />}
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

      {/* Detalle de mora + cartera jurídica */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[2fr_1fr]">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                Detalle de mora
                <InfoTip text="Saldo vencido de inquilinos activos (factura + 30 días), sin intereses; no incluye cartera jurídica. Interés: tasa DIAN del mes × días vencidos. Cartera corriente: facturas aún no vencidas, que también deben pagar." />
              </h2>
              {/* Tasa DIAN del mes — se administra aquí. */}
              <TasaMoraForm
                periodo={moraData.summary.periodo}
                tasaEa={moraData.summary.tasaEa}
                tasaPeriodo={moraData.summary.tasaPeriodo}
                align="left"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <MoraDetalleTable data={filasMora} />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Scale className="h-4 w-4 text-slate-500" />
              Cartera jurídica
              <InfoTip text="Facturas de C-Krea en cobro jurídico: cartera SIESA zona Z99 de clientes con lista de precios ACK, más saldos de inquilinos marcados jurídica. No incluida en el detalle de mora — esta cartera ya no se gestiona por cobro directo, sino por proceso legal." />
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
              <JuridicaList data={juridica} />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
