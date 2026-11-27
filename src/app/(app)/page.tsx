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
  deposito: "#64748b",
} as const

// "60,0%" for the Recaudo total shares.
function formatPct1(pct: number): string {
  return `${pct.toLocaleString("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
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
  info?: string
  // Grey line under the value when the card has no proyectado (e.g. Depósito).
  caption?: string
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

function KpiCard({ title, titleClassName, info, caption, value, negative, download, proyectado, note, action, footnote }: KpiCardProps) {
  const faltan = proyectado ? Math.max(0, proyectado.total - value) : 0
  return (
    // @container: the value's font follows the card width (cqi), so a narrow
    // card (14" laptop, 3 columns) shrinks the figure instead of cutting it.
    <div className="@container flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="min-w-0 flex-1">
        <p className={`flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider ${titleClassName}`}>
          {title}
          {info && <InfoTip text={info} />}
        </p>
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
        {caption && <p className="mt-1 text-sm text-slate-500">{caption}</p>}
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
  const ocupados = t.localesOcupados ?? portfolio.activeClients
  const totalLocales = t.localesTotal ?? portfolio.totalUnits

  // Hero. Recaudo total = ejecutado (canon + cuentas + mora + luz) + depósito;
  // the cumplimiento compares only the ejecutado with its proyección, since
  // depósito has no proyección.
  const recaudoTotal = totalRecaudo + extras.deposito
  const lineasRecaudo = [
    { key: "canon", label: "Canon", value: canon, color: COLOR.canon },
    { key: "cuentas", label: "Cuentas de cobro", value: cuentas, color: COLOR.cuentas },
    { key: "mora", label: "Mora", value: mora, color: COLOR.mora },
    { key: "luz", label: "Luz", value: luz, color: COLOR.luz },
    { key: "deposito", label: "Depósito", value: extras.deposito, color: COLOR.deposito },
  ]
  const lineasProyeccion = [
    { key: "canon", label: "Canon", proyectado: canonProyectado, ejecutado: canon, color: COLOR.canon },
    { key: "cuentas", label: "Cuentas de cobro", proyectado: cuentasProyectado, ejecutado: cuentas, color: COLOR.cuentas },
    { key: "mora", label: "Mora", proyectado: moraProyectado, ejecutado: mora, color: COLOR.mora },
    { key: "luz", label: "Luz", proyectado: luzProyectado, ejecutado: luz, color: COLOR.luz },
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

      {/* Hero: recaudo total (left) + proyección vs ejecutado (right) */}
      <div className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_2fr]">
        {/* Recaudo total: everything collected, incl. depósito, with each line's share */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-slate-500">
            <Wallet className="h-3.5 w-3.5" />
            Recaudo total
            <InfoTip text="Todo lo recaudado en el mes: canon + cuentas de cobro + mora + luz + depósito. El % es la participación de cada línea. La cartera jurídica no suma. El botón de descarga trae el detalle completo en Excel." />
          </p>
          <div className="mt-2 flex items-center gap-3">
            <p className="text-4xl font-bold tabular-nums tracking-tight text-[#2b3fae] sm:text-[2.75rem]">
              {formatCOP(recaudoTotal)}
            </p>
            <DownloadLink
              href={`/api/resumen/recaudo?periodo=${month}`}
              title="Descargar el recaudo completo del mes (Excel): canon, mora, luz, cuentas de cobro y depósito"
              className="text-[#2b3fae] hover:opacity-80"
            />
          </div>
          <ul className="mt-4 divide-y divide-slate-100 text-sm">
            {lineasRecaudo.map((l) => (
              <li key={l.key} className="flex items-center gap-3 py-1.5">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: l.color }} />
                <span className="min-w-0 flex-1 truncate text-slate-600">{l.label}</span>
                <span className="whitespace-nowrap font-semibold tabular-nums text-slate-900">{formatCOP(l.value)}</span>
                <span className="w-12 text-right tabular-nums text-slate-400">{formatPct1(pctOf(l.value, recaudoTotal))}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Proyección vs ejecutado per line + overall cumplimiento ring */}
        <div className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 lg:flex-row lg:items-center">
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Proyección</p>
              <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-slate-700 sm:text-[2.25rem]">
                {formatCOP(proyectado)}
              </p>
              <ul className="mt-4 divide-y divide-slate-100 text-sm">
                {lineasProyeccion.map((l) => (
                  <li key={l.key} className="flex items-center gap-3 py-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: l.color }} />
                    <span className="min-w-0 flex-1 truncate text-slate-600">{l.label}</span>
                    <span className="whitespace-nowrap tabular-nums text-slate-600">{formatCOP(l.proyectado)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-slate-500">
                Ejecutado
                <InfoTip text="Canon + cuentas de cobro + mora + luz del mes, comparado con lo proyectado de cada línea. El depósito no tiene proyección y no entra aquí." />
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-[#2b3fae] sm:text-[2.25rem]">
                {formatCOP(totalRecaudo)}
              </p>
              <ul className="mt-4 divide-y divide-slate-100 text-sm">
                {lineasProyeccion.map((l) => (
                  <li key={l.key} className="flex items-center gap-3 py-2">
                    <span className="min-w-0 flex-1 whitespace-nowrap text-right font-semibold tabular-nums text-slate-900">
                      {formatCOP(l.ejecutado)}
                    </span>
                    <span className="w-12 text-right tabular-nums text-slate-500">
                      {Math.round(pctOf(l.ejecutado, l.proyectado))}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-center gap-2 border-slate-100 lg:border-l lg:pl-8">
            <ProgressRing pct={cumplimiento} color={COLOR.canon} size={144} stroke={12} labelClassName="text-3xl" />
            <p className="text-center text-xs text-slate-500">
              Cumplimiento
              <br />
              de la proyección
            </p>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          title="Canon"
          titleClassName="text-[#4f6bed]"
          info="Pagos de facturas de arriendo (FVS) recibidos hasta 30 días después de la factura, más anticipos: recibos sin factura aplicada (excepto depósitos RKD). Proyectado: facturación del mes (canal R08)."
          value={canon}
          proyectado={{ total: canonProyectado, color: COLOR.canon }}
        />
        <KpiCard
          title="Cuentas de cobro"
          titleClassName="text-[#2ea89a]"
          info="Ejecutado y proyectado registrados a mano en el resumen. Cada cambio queda en el historial con usuario y fecha."
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
          info="Pagos de facturas FVS recibidos más de 30 días después de la factura, sin cartera jurídica. Proyectado: lo recaudado de mora + el saldo vencido pendiente al cierre del mes."
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
          info="Recaudo de servicios públicos (energía) del mes. Proyectado: kWh del mes anterior × tarifa por local; mientras no se registran (hacia el día 10), usa los del mes previo."
          value={luz}
          proyectado={{ total: luzProyectado, color: COLOR.luz }}
        />
        <KpiCard
          title="Depósito"
          titleClassName="text-slate-500"
          info="Recibos de depósito (documentos RKD) sin factura aplicada. Suma en el Recaudo total, pero no tiene proyección: no entra en el ejecutado ni en el cumplimiento."
          value={extras.deposito}
          caption={`${formatPct1(pctOf(extras.deposito, recaudoTotal))} del recaudo total`}
        />

        {/* Desglose de descuentos */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-slate-200 pb-3">
            <p className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Desglose de descuentos
              <InfoTip text="Informativo: los descuentos ya están restados del recaudo, no se descuentan otra vez del total." />
            </p>
            <p className="text-sm font-semibold tabular-nums text-slate-700">−{formatCOP(descuentos)}</p>
          </div>
          <div className="divide-y divide-dashed divide-slate-200">
            <div className="flex items-center justify-between gap-3 py-4">
              <div>
                <p className="flex items-center gap-1.5 font-semibold text-slate-900">
                  Financieros
                  <InfoTip text="Pronto pago contabilizado en el período (auxiliar 42201090 de SIESA)." />
                </p>
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
