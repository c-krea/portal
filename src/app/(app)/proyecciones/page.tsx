export const dynamic = "force-dynamic"

import { PageHeader } from "@/components/layout/page-header"
import { ProyeccionesChart } from "@/components/proyecciones/proyecciones-chart"
import { GenerateButton } from "@/components/proyecciones/generate-button"
import { DetalleTable } from "@/components/proyecciones/detalle-table"
import {
  getProyeccionBreakdown,
  getProyeccionDetalle,
  getProyeccionMensual,
} from "@/lib/data/proyecciones"
import { getFinancialRules } from "@/lib/data/configuracion"
import { formatCOP, formatPercent } from "@/lib/formatters"
import { db } from "@/lib/db/client"
import { sql } from "drizzle-orm"


export default async function ProyeccionesPage() {
  const companies = await db.execute(sql`SELECT id FROM companies LIMIT 1`)
  const companyId = String((companies as Array<Record<string, unknown>>)[0].id)

  const year = 2026
  const nextYear = year + 1

  const [breakdown, detalle, mensual, rules] = await Promise.all([
    getProyeccionBreakdown(companyId, year),
    getProyeccionDetalle(companyId, year),
    getProyeccionMensual(companyId, year),
    getFinancialRules(companyId),
  ])

  const ipcRule  = rules.find((r) => r.ruleKey === "ipc_increment_pct")
  const defaultIpc = ipcRule ? ipcRule.ruleValue : 5.1

  // Pct shares of canon bruto
  const descPct = breakdown.canonBruto > 0 ? (breakdown.totalDescuentos / breakdown.canonBruto) * 100 : 0
  const ppPct   = breakdown.canonBruto > 0 ? (breakdown.totalPP         / breakdown.canonBruto) * 100 : 0

  return (
    <>
      <PageHeader title={`Proyecciones ${year}`} />

      {/* ── KPI breakdown ── */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Canon bruto</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{formatCOP(breakdown.canonBruto)}</p>
          <p className="mt-0.5 text-xs text-slate-400">Antes de descuentos</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Descuentos + PP</p>
          <p className="mt-1 text-xl font-bold text-rose-500">
            − {formatCOP(breakdown.totalDescuentos + breakdown.totalPP)}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            Fase {formatPercent(descPct, 1)} · PP {formatPercent(ppPct, 1)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">IVA (19%)</p>
          <p className="mt-1 text-xl font-bold text-amber-600">+ {formatCOP(breakdown.totalIVA)}</p>
          <p className="mt-0.5 text-xs text-slate-400">Sobre base neta</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm border-blue-200 bg-blue-50">
          <p className="text-xs font-medium uppercase tracking-wider text-blue-600">Total neto c/IVA</p>
          <p className="mt-1 text-xl font-bold text-blue-900">{formatCOP(breakdown.netoConIVA)}</p>
          <p className="mt-0.5 text-xs text-blue-500">Recaudo proyectado {year}</p>
        </div>
      </div>

      {/* ── Formula explainer ── */}
      <div className="mt-4 rounded-xl border border-slate-100 bg-white px-5 py-3 shadow-sm">
        <p className="text-xs text-slate-500">
          <span className="font-medium text-slate-700">Cómo se calcula:</span>
          {" "}Canon bruto <span className="font-mono font-medium text-slate-900">{formatCOP(breakdown.canonBruto)}</span>
          {" "}− Descuentos fase <span className="font-mono font-medium text-rose-600">{formatCOP(breakdown.totalDescuentos)}</span>
          {" "}− Pronto pago <span className="font-mono font-medium text-rose-600">{formatCOP(breakdown.totalPP)}</span>
          {" "}= Base neta <span className="font-mono font-medium text-slate-900">{formatCOP(breakdown.canonBruto - breakdown.totalDescuentos - breakdown.totalPP)}</span>
          {" "}× 1.19 IVA = <span className="font-mono font-bold text-blue-700">{formatCOP(breakdown.netoConIVA)}</span>
        </p>
      </div>

      {/* ── Monthly chart ── */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">Recaudo proyectado por mes — {year} (c/IVA)</p>
          <p className="text-xs text-slate-400">
            Prom. mensual: <span className="font-medium text-slate-700">{formatCOP(Math.round(breakdown.netoConIVA / 12))}</span>
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
        <DetalleTable data={detalle} />
      </div>

      {/* ── Floating generate button ── */}
      <GenerateButton defaultYear={nextYear} defaultIpc={defaultIpc} />
    </>
  )
}
