export const dynamic = "force-dynamic"

import { PageHeader } from "@/components/layout/page-header"
import { MoraTable } from "@/components/mora/mora-table"
import { getMoraRows, getMoraSummary, getJuridicaRows } from "@/lib/data/mora"
import { formatCOP } from "@/lib/formatters"
import { AlertTriangle, Users, Clock, TrendingUp } from "lucide-react"

export default async function MoraPage() {
  const [rows, summary, juridicaRows] = await Promise.all([getMoraRows(), getMoraSummary(), getJuridicaRows()])

  const avgDias =
    rows.length > 0
      ? Math.round(rows.reduce((s, r) => s + r.diasMora, 0) / rows.length)
      : 0

  // Aging buckets
  const b0_30   = rows.filter((r) => r.diasMora <= 30)
  const b31_60  = rows.filter((r) => r.diasMora > 30 && r.diasMora <= 60)
  const b61plus = rows.filter((r) => r.diasMora > 60)

  function bucketStats(bucket: typeof rows) {
    return {
      clientes: bucket.length,
      interes:  bucket.reduce((s, r) => s + r.interesAcumulado, 0),
      total:    bucket.reduce((s, r) => s + r.saldoTotal, 0),
    }
  }

  const stats0_30   = bucketStats(b0_30)
  const stats31_60  = bucketStats(b31_60)
  const stats61plus = bucketStats(b61plus)

  return (
    <>
      <PageHeader title="Gestión de Mora" />

      {/* ── Row 1: core KPIs ── */}
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
              <p className="text-sm sm:text-lg font-bold text-slate-900">{rows.length}</p>
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
              <p className="text-sm sm:text-lg font-bold text-slate-900">{avgDias}d</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-5 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-violet-50">
              <TrendingUp className="h-4 w-4 text-violet-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Interés Acum.</p>
              <p className="text-sm sm:text-lg font-bold text-violet-700 tabular-nums truncate">{formatCOP(summary.totalInteresPortal)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: aging buckets ── */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 0–30 days */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm border-l-4 border-l-amber-400">
          <span className="inline-block rounded-full bg-amber-50 px-3 py-0.5 text-xs font-semibold text-amber-700">
            0 – 30 días
          </span>
          <p className="mt-3 font-mono text-2xl font-bold text-slate-900">
            {formatCOP(stats0_30.total)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Saldo pendiente ·{" "}
            <span className="font-semibold text-slate-700">{stats0_30.clientes} clientes</span>
          </p>
        </div>

        {/* 31–60 days */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm border-l-4 border-l-orange-400">
          <span className="inline-block rounded-full bg-orange-50 px-3 py-0.5 text-xs font-semibold text-orange-700">
            31 – 60 días
          </span>
          <p className="mt-3 font-mono text-2xl font-bold text-slate-900">
            {formatCOP(stats31_60.total)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Saldo pendiente ·{" "}
            <span className="font-semibold text-slate-700">{stats31_60.clientes} clientes</span>
          </p>
        </div>

        {/* 61+ days */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm border-l-4 border-l-rose-500">
          <span className="inline-block rounded-full bg-rose-50 px-3 py-0.5 text-xs font-semibold text-rose-700">
            61+ días
          </span>
          <p className="mt-3 font-mono text-2xl font-bold text-slate-900">
            {formatCOP(stats61plus.total)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Saldo pendiente ·{" "}
            <span className="font-semibold text-slate-700">{stats61plus.clientes} clientes</span>
          </p>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="mt-4">
        <MoraTable data={rows} />
      </div>

      {/* ── Cartera Jurídica ── */}
      {juridicaRows.length > 0 && (
        <div className="mt-8">
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-block rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
              Cartera Jurídica
            </span>
            <span className="text-xs text-slate-400">No incluida en totales de mora</span>
          </div>
          <MoraTable data={juridicaRows} />
        </div>
      )}
    </>
  )
}
