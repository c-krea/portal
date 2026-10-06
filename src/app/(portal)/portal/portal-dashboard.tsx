import {
  getPortalPagos,
  getPortalMedidorStatus,
  getPortalCartera,
  getPortalElectricityInvoiceData,
  getPortalElectricityPeriodos,
  getSyncFreshness,
  EMPTY_PORTAL_CARTERA,
  type PortalProfile,
} from "@/lib/data/portal"
import { formatCOP, formatDate } from "@/lib/formatters"
import { isPpDateEligible } from "@/lib/pronto-pago"
import { getPpWindowDays } from "@/lib/data/configuracion"
import { getTasaMoraVigente } from "@/lib/data/mora"
import { isLecturaWindow } from "@/lib/periodo"
import Link from "next/link"
import { ProfileCard } from "./profile-card"
import { WompiButton } from "./wompi-button"
import { FacturasDownloadButton } from "./facturas-download-button"
import { CarteraBreakdown, type BreakdownRow } from "./cartera-breakdown"
import {
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Zap,
  TrendingUp,
  TriangleAlert,
} from "lucide-react"

function currentPeriodo(now: Date) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

function prevPeriodo(now: Date) {
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

// RGE is issued the month after the consumption it bills (August energy → September
// invoice), so the label names the consumption month like the meter invoice does.
// Verified 2026-10: RGE-368 (invoiced 2026-09-22) equals the 2026-08 meter total.
function energiaConsumo(periodoFactura: number): Date {
  return new Date(Math.floor(periodoFactura / 100), (periodoFactura % 100) - 2, 1)
}
function energiaPeriodoLabel(periodoFactura: number): string {
  return energiaConsumo(periodoFactura).toLocaleDateString("es-CO", { month: "long", year: "numeric" })
}
function energiaPeriodoKey(periodoFactura: number): string {
  const d = energiaConsumo(periodoFactura)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function daysFromNow(date: Date): number {
  const todayCO = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }))
  todayCO.setHours(0, 0, 0, 0)
  return Math.ceil((date.getTime() - todayCO.getTime()) / (1000 * 60 * 60 * 24))
}

export async function PortalDashboard({
  profile,
  readOnly = false,
}: {
  profile: PortalProfile
  readOnly?: boolean
}) {
  const now = new Date()
  const nowCO = new Date(now.toLocaleString("en-US", { timeZone: "America/Bogota" }))
  const periodo = currentPeriodo(nowCO)
  const electricidadPeriodo = prevPeriodo(nowCO)

  const [pagos, medidor, cartera, electricityPeriodosResults, sync, ppWindow, tasaEa] = await Promise.all([
    getPortalPagos(profile.tenantId, 5),
    // Day-9 readings are stored under the previous month's periodo
    getPortalMedidorStatus(profile.unitId, electricidadPeriodo),
    profile.nit ? getPortalCartera(profile.nit) : Promise.resolve(EMPTY_PORTAL_CARTERA),
    Promise.all(profile.allUnitIds.map(id => getPortalElectricityPeriodos(id))),
    getSyncFreshness(),
    getPpWindowDays(),
    getTasaMoraVigente(),
  ])
  // Tasa DIAN vigente (v2.tasa_interes_mora): diaria real = tasa_ea/366. Nunca
  // hardcodear la 0.05% pre-DIAN ni la diaria actual (hoy 0.0756% con 27.68%).
  const tasaDiariaLabel = tasaEa != null ? `${(tasaEa / 366 * 100).toFixed(4)}%` : null
  // Everything owed comes from SIESA cartera, split by tipo_cliente. Energy (RGE) keeps
  // its own line and Wompi step; a paid RGE has left cartera, so it no longer shows.
  const energiaRows = cartera.rows.filter((r) => r.tipo === "energia")
  const facturaRows = cartera.rows.filter(
    (r): r is typeof r & { tipo: "arriendo" | "intereses" } => r.tipo !== "energia",
  )
  // Meter detail cards (kWh, tarifa) for exactly the months the open RGEs bill.
  const energiaPeriodos = [...new Set(energiaRows.map((r) => energiaPeriodoKey(r.periodo)))]
  const energiaCards = (await Promise.all(
    energiaPeriodos.flatMap((p) => profile.allUnitIds.map((id) => getPortalElectricityInvoiceData(id, p))),
  )).filter((v): v is NonNullable<typeof v> => v !== null)
  const electricityUnits = profile.allUnitIds
    .map((id, i) => ({
      unitId:     id,
      unitNumber: profile.allUnits[i],
      periodos:   electricityPeriodosResults[i],
    }))
    .filter(u => u.periodos.length > 0)

  const lastPago = pagos[0]

  // Pronto pago: valid within the stored pp_window_days of each invoice's OWN date
  // (shared rule in src/lib/pronto-pago.ts; 10 today so invoice on the 1st → count
  // from the 2nd → last valid day is the 11th). Per-invoice, since some invoices
  // issue on the 2nd.
  const ppPct = (profile.prontoPagoPct ?? 0) / 100
  const todayMidnight = new Date(nowCO.getFullYear(), nowCO.getMonth(), nowCO.getDate())
  // Only rent earns pronto pago — never mora interest or energy.
  const ppDiscountFor = (r: { tipo: string; fechaFactura: string | null; ventas: number | null }): number =>
    r.tipo === "arriendo" && ppPct > 0 && isPpDateEligible(r.fechaFactura, todayMidnight, ppWindow)
      ? Math.round((r.ventas ?? 0) * ppPct)
      : 0
  const ppDiscountTotal = cartera.rows.reduce((sum, r) => sum + ppDiscountFor(r), 0)
  const isPpWindow = ppDiscountTotal > 0
  const saldoFacturas = cartera.saldoTotal - cartera.saldoEnergia
  const saldoConPp = saldoFacturas - ppDiscountTotal
  // RGE is billed per tenant, not per unit — name the unit only when there is one.
  const energiaUnidad = profile.allUnits.length === 1 ? profile.allUnits[0] : null
  // Wompi pays rent per unit. Documents without a unit (mora interest, old invoices
  // whose sucursal names no current unit) go to the only unit, or to "Todos".
  const unitSaldo = (unitNumber: string) => facturaRows
    .filter((r) => r.unidad === unitNumber)
    .reduce((s, r) => s + r.saldo - ppDiscountFor(r), 0)
  const saldoSinLocal = facturaRows
    .filter((r) => !r.unidad || !profile.allUnits.includes(r.unidad))
    .reduce((s, r) => s + r.saldo - ppDiscountFor(r), 0)

  // ERP feed frozen → cartera is a stale snapshot while interest is still counted
  // against CURRENT_DATE, so a tenant who paid after the freeze would be shown as
  // overdue with a charge growing daily. Withhold mora figures until data is fresh.
  const dataStale = sync.isStale
  const enMora = cartera.vencido > 0
  const showMora = enMora && !dataStale
  const maxDiasMora = cartera.maxDiasMora
  const interesEstimado = showMora ? cartera.interesEstimado : 0

  // Next payment: earliest due date from open invoices (not energy), else 1st of next month
  const earliestVence = facturaRows.map((r) => r.fechaVence).filter(Boolean).sort()[0] ?? null
  const nextPaymentDate = earliestVence
    ? new Date(earliestVence + "T00:00:00")
    : new Date(nowCO.getFullYear(), nowCO.getMonth() + 1, 1)
  const daysToPayment = (enMora && !earliestVence) ? -1 : daysFromNow(nextPaymentDate)
  const paymentUrgent = daysToPayment >= 0 && daysToPayment <= 5
  const paymentWarning = daysToPayment > 5 && daysToPayment <= 10
  const paymentOverdue = daysToPayment < 0

  // Medidor: exactly one submission day — the 9th, moved forward if it is a Sunday
  // or a Colombian holiday (shared rule in src/lib/periodo.ts).
  const isMedidorDay = isLecturaWindow(nowCO)
  const medidorUrgent = !medidor.exists && isMedidorDay

  return (
    <div className="space-y-3">

      {/* ── Mora alert banner — suppressed while ERP data is stale ── */}
      {showMora && (
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
                    {tasaDiariaLabel
                      ? <>{" "}({tasaDiariaLabel}/día, tasa DIAN vigente).</>
                      : <>{" "}(tasa DIAN vigente).</>}
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
            {readOnly ? (
              <div
                aria-disabled="true"
                className="flex items-center gap-3 self-start sm:self-auto shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <Zap className="h-4 w-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-400">Enviar lectura del contador</p>
                  <p className="text-xs text-slate-400">Deshabilitado en vista previa</p>
                </div>
              </div>
            ) : (
              <Link
                href="/portal/medidor"
                className="self-start sm:self-auto shrink-0 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 transition-colors"
              >
                Enviar ahora
              </Link>
            )}
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
        <p className={`font-black leading-none ${
          enMora ? "text-4xl text-rose-600" : "text-4xl text-emerald-600"
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
        saldoTotal={saldoFacturas}
        saldoConPp={saldoConPp}
        ppDiscountTotal={ppDiscountTotal}
        isPpWindow={isPpWindow}
        ppPct={profile.prontoPagoPct ?? 0}
        rows={facturaRows.map((row): BreakdownRow => ({
          tipo:        row.tipo,
          factura:     row.factura,
          periodo:     row.periodo,
          unidad:      row.unidad,
          saldo:       row.saldo,
          ppDiscount:  ppDiscountFor(row),
          vencido:     row.vencido > 0,
          ventas:      row.ventas,
          impuesto:    row.impuesto,
          retenciones: row.retenciones,
        }))}
        electricityInvoices={energiaRows.map(row => ({
          factura:      row.factura,
          unidad:       energiaUnidad,
          periodoLabel: energiaPeriodoLabel(row.periodo),
          total:        row.saldo,
        }))}
      />

      {/* ── Pago en línea ── */}
      {readOnly ? (
        <div
          aria-disabled="true"
          className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <CreditCard className="h-4 w-4 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-400">Pago en línea</p>
            <p className="text-xs text-slate-400">Deshabilitado en vista previa</p>
          </div>
        </div>
      ) : (
        <WompiButton
          nit={profile.nit ?? ""}
          tipoPersona={profile.tipoPersona}
          hasPp={isPpWindow}
          ppPct={profile.prontoPagoPct ?? 0}
          electricityInvoices={energiaCards}
          totalEnergia={cartera.saldoEnergia}
          units={profile.allUnits.map(unitNumber => ({
            unitNumber,
            saldo: unitSaldo(unitNumber) + (profile.allUnits.length === 1 ? saldoSinLocal : 0),
          }))}
          saldoSinLocal={profile.allUnits.length === 1 ? 0 : saldoSinLocal}
        />
      )}

      {/* ── Descargar factura de energía ── */}
      <FacturasDownloadButton
        nombre={profile.razonSocial}
        nit={profile.nit ?? ""}
        units={electricityUnits}
        previewTenantId={readOnly ? profile.tenantId : undefined}
      />

    </div>
  )
}
