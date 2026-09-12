import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { ProyeccionesChart, PROYECCION_LIGHT, PROYECCION_NAVY, type ProyeccionRecaudoMes } from "@/components/proyecciones/proyecciones-chart"
import { InfoTip } from "@/components/pagos/info-tip"
import { GenerateButton } from "@/components/proyecciones/generate-button"
import { DetalleTable } from "@/components/proyecciones/detalle-table"
import { MensualDetalleTable } from "@/components/proyecciones/mensual-detalle-table"
import {
  getProyeccionBreakdown,
  getProyeccionDetalle,
  getProyeccionMensual,
  getRecaudoAnual,
  getVencidoSinPagar,
  getMensualSnapshot,
  getMensualDetalle,
} from "@/lib/data/proyecciones"
import { getFinancialRules } from "@/lib/data/configuracion"
import { formatCOP } from "@/lib/formatters"
import { getEmpresaCkreaId } from "@/lib/empresa"

type Vista = "anual" | "mensual"

export default async function ProyeccionesPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string }>
}) {
  const { vista: vistaParam } = await searchParams
  const vista: Vista = vistaParam === "mensual" ? "mensual" : "anual"

  const empresaId = await getEmpresaCkreaId()
  const year = 2026
  const nextYear = year + 1

  return (
    <>
      <PageHeader title={`Proyecciones ${year}`}>
        <ToggleVista vista={vista} />
      </PageHeader>

      {vista === "mensual" ? (
        <MensualBlock empresaId={empresaId} />
      ) : (
        <AnualBlock empresaId={empresaId} year={year} nextYear={nextYear} />
      )}
    </>
  )
}

function ToggleVista({ vista }: { vista: Vista }) {
  const base = "px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
  const active = "bg-white text-slate-900 shadow-sm"
  const inactive = "text-slate-500 hover:text-slate-700"
  return (
    <div className="inline-flex rounded-lg bg-slate-100 p-1">
      <Link href="/proyecciones?vista=anual" className={`${base} ${vista === "anual" ? active : inactive}`}>
        Anual
      </Link>
      <Link href="/proyecciones?vista=mensual" className={`${base} ${vista === "mensual" ? active : inactive}`}>
        Mensual
      </Link>
    </div>
  )
}

async function MensualBlock({ empresaId }: { empresaId: string }) {
  const [snapshot, detalle] = await Promise.all([
    getMensualSnapshot(empresaId),
    getMensualDetalle(empresaId),
  ])

  return (
    <>
      {/* ── Prominent month header ── */}
      <h2 className="mb-4 text-xl font-bold tracking-tight text-slate-900">
        {snapshot.monthLabel.split(" ")[0]}
      </h2>

      {/* ── Hero cards ── */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr]">
        <div className="rounded-[10px] border border-blue-200 bg-blue-50 p-4 flex flex-col justify-center">
          <p className="text-xs font-medium uppercase tracking-wider text-blue-600">
            Total facturado del mes
          </p>
          <p className="mt-1 text-[26px] font-bold tracking-tight text-blue-900 tabular-nums leading-tight">
            {formatCOP(snapshot.totalFacturado)}
          </p>
          <p className="mt-1 text-sm text-blue-900/60">
            Ventas + impuesto − retenciones de cada factura del mes
          </p>
        </div>

        <div className="rounded-[10px] border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Facturas emitidas
          </p>
          <p className="mt-1 text-[26px] font-bold tracking-tight text-slate-900 tabular-nums leading-tight">
            {snapshot.facturasCount}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            recibos del mes
          </p>
        </div>
      </div>

      {/* ── Detail table ── */}
      <div className="overflow-hidden rounded-[10px] border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">
            Detalle por local — {snapshot.monthLabel} · {detalle.length} arrendatarios
          </p>
        </div>
        <MensualDetalleTable data={detalle} />
      </div>
    </>
  )
}

const MES_CORTO = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
const MES_LARGO = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

async function AnualBlock({
  empresaId,
  year,
  nextYear,
}: {
  empresaId: string
  year: number
  nextYear: number
}) {
  const [breakdown, detalle, mensual, rules, recaudo, vencido] = await Promise.all([
    getProyeccionBreakdown(empresaId, year),
    getProyeccionDetalle(empresaId, year),
    getProyeccionMensual(empresaId, year),
    getFinancialRules(empresaId),
    getRecaudoAnual(empresaId, year),
    getVencidoSinPagar(empresaId, year),
  ])

  const ipcRule  = rules.find((r) => r.ruleKey === "ipc_increment_pct")
  const defaultIpc = ipcRule ? ipcRule.ruleValue : 5.1

  // Mechanical rule: month > today's month. In December the slice is empty → 0.
  const currentMonth = new Date().getMonth() + 1
  const porFacturar = mensual
    .slice(currentMonth)
    .reduce((s, m) => s + m.proyectadoEsperado, 0)
  const mesesRestantes = MES_CORTO.slice(currentMonth)
  const mesesLabel =
    mesesRestantes.length === 0
      ? null
      : mesesRestantes.length === 1
        ? mesesRestantes[0]
        : `${mesesRestantes[0]}–${mesesRestantes[mesesRestantes.length - 1]}`

  const chartData: ProyeccionRecaudoMes[] = mensual.map((m, i) => ({
    mes: m.mes,
    esperado: m.proyectadoEsperado,
    recaudado: i + 1 <= currentMonth ? recaudo.porMes[i] : null,
    esMesEnCurso: i + 1 === currentMonth,
  }))

  return (
    <>
      {/* ── 4-card hero: número arriba, título + InfoTip debajo ── */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[10px] border border-blue-200 bg-blue-50 p-4">
          <p className="text-[26px] font-bold leading-tight tracking-tight tabular-nums text-blue-900">{formatCOP(breakdown.netoEsperado)}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600">
            Esperado {year}
            <InfoTip text={`Meta del año. Piso ${formatCOP(breakdown.pisoConIVA)}, techo ${formatCOP(breakdown.techoConIVA)}.`} />
          </p>
        </div>

        <div className="rounded-[10px] border border-slate-200 bg-white p-4">
          <p className="text-[26px] font-bold leading-tight tracking-tight tabular-nums text-slate-900">{formatCOP(recaudo.ytd)}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Recaudado
            <InfoTip text={`Caja recibida en ${year}.${recaudo.preYear > 0 ? ` Incluye ${formatCOP(recaudo.preYear)} de facturas ${year - 1}.` : ""}`} />
          </p>
        </div>

        <div className="rounded-[10px] border border-slate-200 bg-white p-4">
          <p className="text-[26px] font-bold leading-tight tracking-tight tabular-nums text-rose-600">{formatCOP(vencido.total)}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Vencido
            <InfoTip text={`Facturas ya vencidas. Excluye cartera jurídica${vencido.previo > 0 ? ` y ${formatCOP(vencido.previo)} de años anteriores` : ""}.`} />
          </p>
        </div>

        <div className="rounded-[10px] border border-slate-200 bg-white p-4">
          <p className="text-[26px] font-bold leading-tight tracking-tight tabular-nums text-slate-900">{formatCOP(porFacturar)}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Por facturar
            <InfoTip text={`Meses que faltan por facturar${mesesLabel ? `: ${mesesLabel}` : ""}.`} />
          </p>
        </div>
      </div>

      {/* ── Monthly chart: esperado vs cash on that month's invoices ── */}
      <div className="mb-4 rounded-[10px] border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <p className="flex items-center gap-1.5 text-base font-semibold text-slate-900">
            Esperado vs. recaudado {year}
            <InfoTip text={`Las barras sólidas agrupan por mes de factura, no por fecha de pago. ${MES_LARGO[currentMonth - 1]} sigue en curso.`} />
          </p>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: PROYECCION_LIGHT }} />
              Esperado
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: PROYECCION_NAVY }} />
              Recaudado
            </span>
          </div>
        </div>
        <div className="px-2 py-3">
          <ProyeccionesChart data={chartData} />
        </div>
      </div>

      {/* ── Detail table ── */}
      <div className="rounded-[10px] border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="flex items-center gap-1.5 text-base font-semibold text-slate-900">
            Detalle por local
            <InfoTip text={`${detalle.length} contratos con canon proyectado para ${year}.`} />
          </p>
        </div>
        <DetalleTable data={detalle} year={year} />
      </div>

      {/* ── Floating generate button ── */}
      <GenerateButton defaultYear={nextYear} defaultIpc={defaultIpc} />
    </>
  )
}
