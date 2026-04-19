export const dynamic = "force-dynamic"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import {
  getPortalProfile,
  getPortalPagosPage,
  getPortalPagosKpis,
} from "@/lib/data/portal"
import { formatCOP, formatDate } from "@/lib/formatters"
import Link from "next/link"
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Banknote,
} from "lucide-react"

function PaginationBar({
  page,
  totalPages,
}: {
  page: number
  totalPages: number
}) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="flex items-center gap-1 px-5 py-3 border-t border-slate-100">
      {page > 1 && (
        <Link
          href={`?page=${page - 1}`}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
        >
          ← Anterior
        </Link>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={`?page=${p}`}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            p === page
              ? "bg-slate-900 text-white"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          {p}
        </Link>
      ))}
      {page < totalPages && (
        <Link
          href={`?page=${page + 1}`}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
        >
          Siguiente →
        </Link>
      )}
    </div>
  )
}

export default async function PagosHistorialPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const profile = await getPortalProfile(user.id)
  if (!profile) redirect("/portal")

  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? "1", 10))
  const pageSize = 10

  const [{ pagos, totalCount }, kpis] = await Promise.all([
    getPortalPagosPage(profile.tenantId, page, pageSize),
    getPortalPagosKpis(profile.tenantId),
  ])

  const totalPages = Math.ceil(totalCount / pageSize)
  const pctATiempo = kpis.totalCount > 0
    ? Math.round((kpis.aTiempoCount / kpis.totalCount) * 100)
    : 0

  return (
    <div className="space-y-5">
      <Link
        href="/portal"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al portal
      </Link>

      <div>
        <h1 className="text-xl font-bold text-slate-900">Historial de Pagos</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Local {profile.unitNumber} — {profile.nombreCorto ?? profile.razonSocial}
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Banknote className="h-4 w-4 text-slate-400" />
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Total Pagado
            </p>
          </div>
          <p className="text-xl font-bold text-slate-900">
            {formatCOP(kpis.totalPagado)}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {kpis.totalCount} pagos registrados
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              A Tiempo
            </p>
          </div>
          <p className="text-xl font-bold text-emerald-600">{pctATiempo}%</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {kpis.aTiempoCount} de {kpis.totalCount} pagos
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-rose-400" />
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Días de Mora
            </p>
          </div>
          <p className="text-xl font-bold text-rose-600">
            {kpis.avgDiasTarde != null ? `${kpis.avgDiasTarde} días` : "—"}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            promedio cuando tardío
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-blue-400" />
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Días Anticipación
            </p>
          </div>
          <p className="text-xl font-bold text-blue-600">
            {kpis.avgDiasAnticipacion != null
              ? `${kpis.avgDiasAnticipacion} días`
              : "—"}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            promedio cuando a tiempo
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <p className="text-sm font-semibold text-slate-900">
            Pagos —{" "}
            <span className="font-normal text-slate-500">
              página {page} de {totalPages} · {totalCount} registros
            </span>
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 text-left">Fecha Pago</th>
                <th className="px-5 py-3 text-left">Vencimiento</th>
                <th className="px-5 py-3 text-left">Concepto</th>
                <th className="px-5 py-3 text-right">Valor</th>
                <th className="px-5 py-3 text-left">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pagos.map((p) => {
                const late = p.diasDiff != null && p.diasDiff > 0
                const early = p.diasDiff != null && p.diasDiff < 0
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-700">
                      {formatDate(p.fechaRecaudo)}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {p.fechaVencimiento ? formatDate(p.fechaVencimiento) : "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {p.concepto ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-slate-900">
                      {formatCOP(p.valorFinal)}
                    </td>
                    <td className="px-5 py-3">
                      {late ? (
                        <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-600">
                          {p.diasDiff}d tarde
                        </span>
                      ) : early ? (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          {Math.abs(p.diasDiff!)}d anticipado
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          A tiempo
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <PaginationBar page={page} totalPages={totalPages} />
      </div>
    </div>
  )
}
