export const dynamic = "force-dynamic"

import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { ProyeccionesChart } from "@/components/proyecciones/proyecciones-chart"
import { GenerateButton } from "@/components/proyecciones/generate-button"
import { DetalleTable } from "@/components/proyecciones/detalle-table"
import { MensualDetalleTable } from "@/components/proyecciones/mensual-detalle-table"
import {
  getProyeccionBreakdown,
  getProyeccionDetalle,
  getProyeccionMensual,
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
      <h2 className="-mt-3 text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
        {snapshot.monthLabel.split(" ")[0]}
      </h2>

      {/* ── Hero cards ── */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-[2fr_1fr]">
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-5 sm:px-6 sm:py-6 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-medium uppercase tracking-wider text-blue-600">
            Total facturado del mes
          </p>
          <p className="mt-2 text-4xl sm:text-5xl font-bold text-blue-900 tabular-nums leading-tight">
            {formatCOP(snapshot.totalFacturado)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 sm:px-6 sm:py-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Facturas emitidas
          </p>
          <p className="mt-1 text-3xl sm:text-4xl font-bold text-slate-900 tabular-nums leading-tight">
            {snapshot.facturasCount}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            recibos del mes
          </p>
        </div>
      </div>

      {/* ── Formula explainer ── */}
      <div className="mt-4 hidden sm:block rounded-xl border border-slate-100 bg-white px-5 py-3 shadow-sm">
        <p className="text-xs text-slate-500">
          <span className="font-medium text-slate-700">Cómo se calcula:</span>
          {" "}<span className="font-mono font-medium text-slate-900">ventas + impuesto − retenciones</span>
          {" "}de cada factura del mes.
        </p>
      </div>

      {/* ── Detail table ── */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <p className="text-sm font-semibold text-slate-800">
            Detalle por local — {snapshot.monthLabel} · {detalle.length} arrendatarios
          </p>
        </div>
        <MensualDetalleTable data={detalle} />
      </div>
    </>
  )
}

async function AnualBlock({
  empresaId,
  year,
  nextYear,
}: {
  empresaId: string
  year: number
  nextYear: number
}) {
  const [breakdown, detalle, mensual, rules] = await Promise.all([
    getProyeccionBreakdown(empresaId, year),
    getProyeccionDetalle(empresaId, year),
    getProyeccionMensual(empresaId, year),
    getFinancialRules(empresaId),
  ])

  const ipcRule  = rules.find((r) => r.ruleKey === "ipc_increment_pct")
  const defaultIpc = ipcRule ? ipcRule.ruleValue : 5.1

  const baseNeta = breakdown.canonBruto - breakdown.totalDescuentos

  return (
    <>
      {/* ── 3-card range (main emphasis) ── */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Piso</p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">{formatCOP(breakdown.pisoConIVA)}</p>
          <p className="mt-2 text-sm text-slate-400">Si todos toman PP · peor caso</p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 px-6 py-5 shadow-sm sm:scale-[1.02]">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Esperado</p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-blue-900 tabular-nums">{formatCOP(breakdown.netoEsperado)}</p>
          <p className="mt-2 text-sm text-blue-500">Según historial · más probable</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Techo</p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">{formatCOP(breakdown.techoConIVA)}</p>
          <p className="mt-2 text-sm text-slate-400">Si nadie toma PP · mejor caso</p>
        </div>
      </div>

      {/* ── 4-card breakdown strip (secondary, narrower) ── */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Canon bruto</p>
          <p className="mt-1 text-base font-bold text-slate-900 tabular-nums">{formatCOP(breakdown.canonBruto)}</p>
          <p className="mt-0.5 text-xs text-slate-400">Antes de descuentos</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Descuentos de fase</p>
          <p className="mt-1 text-base font-bold text-rose-600 tabular-nums">− {formatCOP(breakdown.totalDescuentos)}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {breakdown.canonBruto > 0 ? (breakdown.totalDescuentos / breakdown.canonBruto * 100).toFixed(1) : "0"}% del canon bruto
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Bonus PP no usado</p>
          <p className="mt-1 text-base font-bold text-emerald-600 tabular-nums">+ {formatCOP(breakdown.netoEsperado - breakdown.pisoConIVA)}</p>
          <p className="mt-0.5 text-xs text-slate-400">Pagos fuera de plazo (no toman PP)</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-blue-500">Recaudo esperado</p>
          <p className="mt-1 text-base font-bold text-blue-900 tabular-nums">{formatCOP(breakdown.netoEsperado)}</p>
          <p className="mt-0.5 text-xs text-blue-400">Piso {formatCOP(breakdown.pisoConIVA)}</p>
        </div>
      </div>

      {/* ── Monthly chart ── */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-800">Recaudo esperado por mes — {year} (c/IVA)</p>
          <p className="text-xs text-slate-400">
            Prom. mensual: <span className="font-medium text-slate-700">{formatCOP(Math.round(breakdown.netoEsperado / 12))}</span>
          </p>
        </div>
        <ProyeccionesChart data={mensual} />
      </div>

      {/* ── Detail table ── */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <p className="text-sm font-semibold text-slate-800">
            Detalle por local — {detalle.length} contratos
          </p>
        </div>
        <DetalleTable data={detalle} year={year} />
      </div>

      {/* ── Floating generate button ── */}
      <GenerateButton defaultYear={nextYear} defaultIpc={defaultIpc} />
    </>
  )
}
