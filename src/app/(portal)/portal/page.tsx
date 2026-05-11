export const dynamic = "force-dynamic"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import {
  getPortalProfile,
  getPortalPagos,
  getPortalMedidorStatus,
  getPortalCartera,
  getPortalElectricityInvoiceData,
  getPortalElectricityPeriodos,
} from "@/lib/data/portal"
import { formatCOP, formatDate } from "@/lib/formatters"
import Link from "next/link"
import { ProfileCard } from "./profile-card"
import { WompiButton } from "./wompi-button"
import { FacturasDownloadButton } from "./facturas-download-button"
import { CarteraBreakdown, type BreakdownRow } from "./cartera-breakdown"
import {
  CheckCircle2,
  AlertCircle,
  Zap,
  TrendingUp,
  TriangleAlert,
} from "lucide-react"

function currentPeriodo(now: Date) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
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

  const now = new Date()
  const periodo = currentPeriodo(now)
  const todayDay = now.getDate()
  const currentPeriodInt = now.getFullYear() * 100 + (now.getMonth() + 1)

  const [pagos, medidor, cartera, electricityInvoiceResults, electricityPeriodosResults] = await Promise.all([
    getPortalPagos(profile.tenantId, 5),
    getPortalMedidorStatus(profile.unitId, periodo),
    profile.nit ? getPortalCartera(profile.nit) : Promise.resolve({ saldoTotal: 0, facturaCount: 0, vencido: 0, maxDiasMora: 0, maxDiasInterest: 0, interesEstimado: 0, rows: [] }),
    Promise.all(profile.allUnitIds.map(id => getPortalElectricityInvoiceData(id, periodo))),
    Promise.all(profile.allUnitIds.map(id => getPortalElectricityPeriodos(id))),
  ])
  const electricityInvoices = electricityInvoiceResults.filter((v): v is NonNullable<typeof v> => v !== null)
  const electricityUnits = profile.allUnitIds
    .map((id, i) => ({
      unitId:     id,
      unitNumber: profile.allUnits[i],
      periodos:   electricityPeriodosResults[i],
    }))
    .filter(u => u.periodos.length > 0)

  const lastPago = pagos[0]

  // Pronto pago: apply per invoice, current period only, within first 10 days
  const ppPct = (profile.prontoPagoPct ?? 0) / 100
  const isPpWindow = todayDay <= 10 && ppPct > 0
  const ppDiscountTotal = isPpWindow
    ? cartera.rows
        .filter(r => r.periodo === currentPeriodInt)
        .reduce((sum, r) => sum + Math.round((r.ventas ?? 0) * ppPct), 0)
    : 0
  const saldoConPp = cartera.saldoTotal - ppDiscountTotal

  const enMora = cartera.vencido > 0
  const maxDiasMora = cartera.maxDiasMora
  const interesEstimado = enMora ? cartera.interesEstimado : 0

  // Next payment: earliest due date from open invoices, else 1st of next month
  const earliestVence = cartera.rows.map((r) => r.fechaVence).filter(Boolean).sort()[0] ?? null
  const nextPaymentDate = earliestVence
    ? new Date(earliestVence + "T00:00:00")
    : (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + 1, 1) })()
  const daysToPayment = daysFromNow(nextPaymentDate)
  const paymentUrgent = daysToPayment >= 0 && daysToPayment <= 5
  const paymentWarning = daysToPayment > 5 && daysToPayment <= 10
  const paymentOverdue = daysToPayment < 0

  // Medidor: submissions only on day 9 of each month
  const isMedidorDay = todayDay === 9
  const medidorUrgent = !medidor.exists && isMedidorDay

  return (
    <div className="space-y-3">

      {/* ── Mora alert banner ── */}
      {enMora && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-start gap-3">
            <TriangleAlert className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-rose-800">
                Cuenta en mora — {maxDiasMora} día{maxDiasMora !== 1 ? "s" : ""} vencida
              </p>
              <p className="mt-1 text-sm text-rose-700">
                {lastPago
                  ? <>El último pago registrado fue el{" "}<strong>{formatDate(lastPago.fechaRecaudo)}</strong>.</>
                  : <>Sin pagos registrados.</>}
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

      {/* ── Medidor banner — only shown on day 9 if not yet submitted ── */}
      {medidorUrgent && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 shrink-0 mt-0.5 text-rose-500" />
              <div>
                <p className="font-semibold text-rose-800">
                  ¡Hoy es el día! Envíe su lectura del contador
                </p>
                <p className="mt-0.5 text-sm text-rose-600">
                  Sin lectura hoy → se cobra 1.5× el promedio de los últimos 3 meses.
                </p>
              </div>
            </div>
            <Link
              href="/portal/medidor"
              className="self-start sm:self-auto shrink-0 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 transition-colors"
            >
              Enviar ahora
            </Link>
          </div>
        </div>
      )}

      {/* ── Tenant info card ── */}
      <ProfileCard profile={profile} />

      {/* ── Estado de Cuenta ── */}
      <div className={`rounded-xl border p-4 shadow-sm ${
        enMora ? "border-rose-200 bg-rose-50" : "border-emerald-100 bg-emerald-50"
      }`}>
        <div className="flex items-center gap-2 mb-2">
          {enMora
            ? <AlertCircle className="h-4 w-4 text-rose-400" />
            : <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          }
          <p className="text-sm font-semibold text-slate-500">
            Estado de Cuenta
          </p>
        </div>
        <p className={`text-4xl font-black leading-none ${
          enMora ? "text-rose-600" : "text-emerald-600"
        }`}>
          {enMora ? "En Mora" : "Al Día"}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {enMora
            ? `${maxDiasMora} días vencido`
            : `${pagos.length} pago${pagos.length !== 1 ? "s" : ""} registrados`}
        </p>
      </div>

      {/* ── Próximo Pago ── */}
      <div className={`rounded-xl border p-4 shadow-sm ${
        paymentOverdue || paymentUrgent ? "border-rose-200 bg-rose-50"
        : paymentWarning               ? "border-amber-200 bg-amber-50"
        :                                "border-slate-200 bg-white"
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className={`h-4 w-4 ${
            paymentOverdue || paymentUrgent ? "text-rose-400"
            : paymentWarning               ? "text-amber-400"
            :                                "text-slate-400"
          }`} />
          <p className="text-sm font-semibold text-slate-500">
            Próximo Pago
          </p>
        </div>
        {paymentOverdue ? (
          <p className="text-4xl font-black tracking-tight text-rose-600">VENCIDO</p>
        ) : daysToPayment === 0 ? (
          <p className="text-4xl font-black tracking-tight text-rose-600">HOY</p>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className={`text-4xl font-black tabular-nums leading-none ${
              paymentUrgent   ? "text-rose-600"
              : paymentWarning ? "text-amber-600"
              :                  "text-slate-900"
            }`}>
              {daysToPayment}
            </span>
            <span className={`text-lg font-semibold ${
              paymentUrgent   ? "text-rose-400"
              : paymentWarning ? "text-amber-400"
              :                  "text-slate-400"
            }`}>
              días
            </span>
          </div>
        )}
        <p className="mt-1 text-xs text-slate-400">
          Aprox.{" "}
          {nextPaymentDate.toLocaleDateString("es-CO", {
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      {/* ── Total a Pagar ── */}
      <CarteraBreakdown
        saldoTotal={cartera.saldoTotal}
        saldoConPp={saldoConPp}
        ppDiscountTotal={ppDiscountTotal}
        isPpWindow={isPpWindow}
        ppPct={profile.prontoPagoPct ?? 0}
        rows={cartera.rows.map((row): BreakdownRow => ({
          periodo:     row.periodo,
          unidad:      row.unidad,
          saldo:       row.saldo,
          ppDiscount:  isPpWindow && row.periodo === currentPeriodInt
                         ? Math.round((row.ventas ?? 0) * ppPct)
                         : 0,
          vencido:     row.vencido > 0,
          ventas:      row.ventas,
          impuesto:    row.impuesto,
          retenciones: row.retenciones,
        }))}
      />

      {/* ── Pago en línea ── */}
      <WompiButton
        nit={profile.nit ?? ""}
        tipoPersona={profile.tipoPersona}
        hasPp={isPpWindow && ppDiscountTotal > 0}
        ppPct={profile.prontoPagoPct ?? 0}
        electricityInvoices={electricityInvoices}
        units={profile.allUnits.map(unitNumber => {
          const rawSaldo = cartera.rows
            .filter(r => r.unidad === unitNumber)
            .reduce((s, r) => s + r.saldo, 0)
          const unitPpDiscount = isPpWindow
            ? cartera.rows
                .filter(r => r.unidad === unitNumber && r.periodo === currentPeriodInt)
                .reduce((sum, r) => sum + Math.round((r.ventas ?? 0) * ppPct), 0)
            : 0
          return { unitNumber, saldo: rawSaldo - unitPpDiscount }
        })}
      />

      {/* ── Descargar factura de energía ── */}
      <FacturasDownloadButton
        nombre={profile.razonSocial}
        nit={profile.nit ?? ""}
        units={electricityUnits}
      />

    </div>
  )
}
