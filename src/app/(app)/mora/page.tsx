export const dynamic = "force-dynamic"

import { PageHeader } from "@/components/layout/page-header"
import { MoraTable } from "@/components/mora/mora-table"
import { TasaMoraForm } from "@/components/mora/tasa-mora-form"
import { getMoraData } from "@/lib/data/mora"
import { formatCOP } from "@/lib/formatters"
import { AlertTriangle, Users, Clock, TrendingUp } from "lucide-react"

export default async function MoraPage() {
  const { activos, juridica, summary } = await getMoraData()

  // Aging buckets (active tenants) by días vencidos
  const bucket = (arr: typeof activos) => ({
    clientes: arr.length,
    total:    arr.reduce((s, r) => s + r.saldoVencido, 0),
    interes:  arr.reduce((s, r) => s + r.interes, 0),
  })
  const s1_30   = bucket(activos.filter((r) => r.diasMora <= 30))
  const s31_60  = bucket(activos.filter((r) => r.diasMora > 30 && r.diasMora <= 60))
  const s61plus = bucket(activos.filter((r) => r.diasMora > 60))

  return (
    <>
      <PageHeader title="Gestión de Mora" />

      {/* ── Monthly DIAN rate ── */}
      <div className="mb-4">
        <TasaMoraForm periodo={summary.periodo} tasaEa={summary.tasaEa} />
      </div>

      {/* ── Row 1: core KPIs (active tenants) ── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-5 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-rose-50">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Cartera Vencida</p>
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
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Clientes</p>
              <p className="text-sm sm:text-lg font-bold text-slate-900">{summary.clientes}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-5 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-amber-50">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Prom. Días</p>
              <p className="text-sm sm:text-lg font-bold text-slate-900">{summary.promedioDias}d</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-5 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-violet-50">
              <TrendingUp className="h-4 w-4 text-violet-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Interés Mora</p>
              <p className="text-sm sm:text-lg font-bold text-violet-700 tabular-nums truncate">{formatCOP(summary.totalInteres)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: aging buckets ── */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "1 – 30 días",  s: s1_30,   bar: "border-l-amber-400",  chip: "bg-amber-50 text-amber-700" },
          { label: "31 – 60 días", s: s31_60,  bar: "border-l-orange-400", chip: "bg-orange-50 text-orange-700" },
          { label: "61+ días",     s: s61plus, bar: "border-l-rose-500",   chip: "bg-rose-50 text-rose-700" },
        ].map(({ label, s, bar, chip }) => (
          <div key={label} className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm border-l-4 ${bar}`}>
            <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${chip}`}>{label}</span>
            <p className="mt-3 font-mono text-2xl font-bold text-slate-900">{formatCOP(s.total)}</p>
            <p className="mt-1 text-xs text-slate-500">
              Saldo vencido · <span className="font-semibold text-slate-700">{s.clientes} clientes</span>
              {" · "}interés <span className="font-semibold text-violet-700">{formatCOP(s.interes)}</span>
            </p>
          </div>
        ))}
      </div>

      {/* ── Table (active tenants) ── */}
      <div className="mt-4">
        <MoraTable data={activos} />
      </div>

      {/* ── Cartera Jurídica (separate — not in the KPI totals above) ── */}
      {juridica.length > 0 && (
        <div className="mt-8">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="inline-block rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
              Cartera Jurídica
            </span>
            <span className="text-xs text-slate-400">
              Inquilinos jurídicos + ex-inquilinos con saldo · No incluida en los totales de arriba
            </span>
            <span className="ml-auto text-xs text-slate-500">
              Saldo <span className="font-semibold text-rose-700">{formatCOP(summary.juridicaCarteraVencida)}</span>
              {" · "}interés <span className="font-semibold text-violet-700">{formatCOP(summary.juridicaInteres)}</span>
            </span>
          </div>
          <MoraTable data={juridica} />
        </div>
      )}
    </>
  )
}
