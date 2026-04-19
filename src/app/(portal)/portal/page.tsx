export const dynamic = "force-dynamic"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import {
  getPortalProfile,
  getPortalPagos,
  getPortalMedidorStatus,
} from "@/lib/data/portal"
import { formatCOP, formatDate } from "@/lib/formatters"
import Link from "next/link"
import { ProfileCard } from "./profile-card"
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  TrendingUp,
  ChevronRight,
  TriangleAlert,
  Banknote,
} from "lucide-react"

function currentPeriodo() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

function periodoLabel(periodo: string) {
  const [year, month] = periodo.split("-")
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString("es-CO", { month: "long", year: "numeric" })
}

function addDays(dateStr: string, days: number): Date {
  const d = new Date(dateStr + "T00:00:00")
  d.setDate(d.getDate() + days)
  return d
}

function daysFromNow(date: Date): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default async function PortalPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const profile = await getPortalProfile(user.id)
  if (!profile) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        No se encontró un contrato activo asociado a este usuario. Contacte al
        administrador.
      </div>
    )
  }

  const periodo = currentPeriodo()
  const todayDay = new Date().getDate()

  const [pagos, medidor] = await Promise.all([
    getPortalPagos(profile.tenantId, 5),
    getPortalMedidorStatus(profile.unitId, periodo),
  ])

  // Next payment estimate: last payment + 30 days
  const lastPago = pagos[0]
  const nextPaymentDate = lastPago
    ? addDays(lastPago.fechaRecaudo, 30)
    : addDays(profile.fechaInicio, 30)

  const daysToPayment = daysFromNow(nextPaymentDate)

  // Mora: overdue > 35 days since last payment
  const daysSinceLastPago = lastPago
    ? Math.floor(
        (Date.now() - new Date(lastPago.fechaRecaudo + "T00:00:00").getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : Infinity
  const enMora = daysSinceLastPago > 35
  // Days actually in mora (after the 30-day cycle)
  const diasEnMora = enMora ? daysSinceLastPago - 30 : 0
  // Estimated interest: 0.05%/day on canon, starts after 10 grace days of mora
  const interesEstimado = enMora
    ? Math.round(profile.canonBase * 0.0005 * Math.max(0, diasEnMora - 10))
    : 0

  // Medidor deadline
  const medidorDeadlineDays = 10 - todayDay // days left in submission window
  const medidorUrgent = !medidor.exists && todayDay <= 10 && medidorDeadlineDays <= 3
  const medidorOverdue = !medidor.exists && todayDay > 10

  return (
    <div className="space-y-5">

      {/* ── Mora alert banner ── */}
      {enMora && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-start gap-3">
            <TriangleAlert className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-rose-800">
                Cuenta en mora — {diasEnMora} día{diasEnMora !== 1 ? "s" : ""} vencida
              </p>
              <p className="mt-1 text-sm text-rose-700">
                El último pago registrado fue el{" "}
                <strong>{formatDate(lastPago!.fechaRecaudo)}</strong>.
                {interesEstimado > 0 && (
                  <> Interés acumulado estimado:{" "}
                    <strong>{formatCOP(interesEstimado)}</strong>
                    {" "}(0.05%/día).
                  </>
                )}
              </p>
              <p className="mt-1 text-xs text-rose-500">
                Para regularizar su cuenta, comuníquese con la administración.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Medidor deadline banner (days 7-10, not yet submitted) ── */}
      {medidorUrgent && (
        <div className={`rounded-xl border p-4 ${
          medidorDeadlineDays <= 1
            ? "border-rose-200 bg-rose-50"
            : "border-amber-200 bg-amber-50"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Zap className={`h-5 w-5 shrink-0 mt-0.5 ${
                medidorDeadlineDays <= 1 ? "text-rose-500" : "text-amber-500"
              }`} />
              <div>
                <p className={`font-semibold ${
                  medidorDeadlineDays <= 1 ? "text-rose-800" : "text-amber-800"
                }`}>
                  {medidorDeadlineDays <= 0
                    ? "¡Último día! Envíe su lectura hoy"
                    : `Quedan ${medidorDeadlineDays} día${medidorDeadlineDays !== 1 ? "s" : ""} para enviar la lectura`}
                </p>
                <p className={`mt-0.5 text-sm ${
                  medidorDeadlineDays <= 1 ? "text-rose-600" : "text-amber-700"
                }`}>
                  Sin lectura → se cobra 1.5× el promedio de los últimos 3 meses.
                </p>
              </div>
            </div>
            <Link
              href="/portal/medidor"
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${
                medidorDeadlineDays <= 1
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-amber-600 hover:bg-amber-700"
              }`}
            >
              Enviar ahora
            </Link>
          </div>
        </div>
      )}

      {/* ── Tenant info card — expandable ── */}
      <ProfileCard profile={profile} />

      {/* ── KPI grid — 3 cards ── */}
      {(() => {
        const urgent = daysToPayment <= 5
        const warning = daysToPayment > 5 && daysToPayment <= 10
        const overdue = daysToPayment < 0
        return (
          <div className="grid grid-cols-3 gap-4">

            {/* 1 — Countdown */}
            {/* 1 — Countdown */}
            <div className={`flex flex-col rounded-xl border p-5 shadow-sm ${
              overdue || urgent ? "border-rose-200 bg-rose-50"
              : warning        ? "border-amber-200 bg-amber-50"
              :                  "border-slate-200 bg-white"
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className={`h-4 w-4 ${
                  overdue || urgent ? "text-rose-400"
                  : warning         ? "text-amber-400"
                  :                   "text-slate-400"
                }`} />
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Próximo Pago
                </p>
              </div>
              <div className="flex-1">
                {overdue ? (
                  <p className="text-4xl font-black tracking-tight text-rose-600">VENCIDO</p>
                ) : daysToPayment === 0 ? (
                  <p className="text-4xl font-black tracking-tight text-rose-600">HOY</p>
                ) : (
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-5xl font-black tabular-nums leading-none ${
                      urgent  ? "text-rose-600"
                      : warning ? "text-amber-600"
                      :           "text-slate-900"
                    }`}>
                      {daysToPayment}
                    </span>
                    <span className={`text-lg font-semibold ${
                      urgent  ? "text-rose-400"
                      : warning ? "text-amber-400"
                      :           "text-slate-400"
                    }`}>
                      días
                    </span>
                  </div>
                )}
              </div>
              <p className="mt-auto pt-3 text-xs text-slate-400">
                Aprox.{" "}
                {nextPaymentDate.toLocaleDateString("es-CO", {
                  day: "numeric",
                  month: "long",
                })}
              </p>
            </div>

            {/* 2 — Total a pagar */}
            <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Banknote className="h-4 w-4 text-slate-400" />
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Total a Pagar
                </p>
              </div>
              <div className="flex flex-1 items-end">
                <p className="text-4xl font-black tabular-nums leading-none text-slate-900">
                  {formatCOP(profile.canonBase)}
                </p>
              </div>
              <p className="mt-auto pt-3 text-xs text-slate-400">
                Canon mensual
              </p>
            </div>

            {/* 3 — Estado de cuenta */}
            <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                {enMora
                  ? <AlertCircle className="h-4 w-4 text-rose-400" />
                  : <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                }
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Estado de Cuenta
                </p>
              </div>
              <div className="flex-1">
                <p className={`text-5xl font-black leading-none ${
                  enMora ? "text-rose-600" : "text-emerald-600"
                }`}>
                  {enMora ? "En Mora" : "Al Día"}
                </p>
              </div>
              <p className="mt-auto pt-3 text-xs text-slate-400">
                {enMora
                  ? `${diasEnMora} días vencido`
                  : `${pagos.length} pago${pagos.length !== 1 ? "s" : ""} registrados`}
              </p>
            </div>

          </div>
        )
      })()}

      {/* ── Medidor card — clickable ── */}
      <Link
        href="/portal/medidor"
        className={`flex items-center justify-between rounded-xl border p-5 shadow-sm transition-colors ${
          medidorOverdue
            ? "border-slate-200 bg-white hover:border-slate-300"
            : medidorUrgent
            ? "border-amber-200 bg-amber-50 hover:border-amber-300"
            : "border-slate-200 bg-white hover:border-slate-300"
        }`}
      >
        <div className="flex items-center gap-3">
          <Zap className={`h-4 w-4 ${medidorUrgent ? "text-amber-500" : "text-slate-400"}`} />
          <div>
            <p className="text-sm font-medium text-slate-700">
              Lectura del Contador — {periodoLabel(periodo)}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {medidor.exists
                ? `${medidor.lecturaActual?.toLocaleString("es-CO")} kWh registrados`
                : medidorOverdue
                ? "Plazo vencido — se aplicará cobro por promedio"
                : `Plazo: días 1–10 del mes · quedan ${medidorDeadlineDays} día${medidorDeadlineDays !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {medidor.exists ? (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Enviada
            </span>
          ) : medidorOverdue ? (
            <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
              Vencido
            </span>
          ) : (
            <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              medidorUrgent ? "bg-amber-100 text-amber-700" : "bg-amber-50 text-amber-700"
            }`}>
              <Clock className="h-3.5 w-3.5" />
              Pendiente
            </span>
          )}
          <ChevronRight className="h-4 w-4 text-slate-300" />
        </div>
      </Link>

      {/* ── Historial de pagos — últimos 5 ── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Historial de Pagos
          </h2>
          <Link
            href="/portal/pagos"
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            Ver historial completo
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 text-left">Fecha</th>
                <th className="px-5 py-3 text-left">Concepto</th>
                <th className="px-5 py-3 text-right">Valor</th>
                <th className="px-5 py-3 text-left">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pagos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-400">
                    Sin pagos registrados
                  </td>
                </tr>
              ) : (
                pagos.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-700">
                      {formatDate(p.fechaRecaudo)}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {p.concepto ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-slate-900">
                      {formatCOP(p.valorFinal)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        Recaudado
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
