export const dynamic = "force-dynamic"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getPortalProfile, getPortalMedidorStatus, getPortalMedidorHistory } from "@/lib/data/portal"
import { execute } from "@/lib/db/executor"
import { getEmpresaCkreaId } from "@/lib/empresa"
import { getElectricityTarifaForUnit } from "@/lib/data/electricity"
import { MedidorForm } from "./form"
import { HistorialChart } from "./chart"
import { CheckCircle2, Zap, AlertCircle, ArrowLeft, Camera } from "lucide-react"
import Link from "next/link"

function currentPeriodo() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

function meterDisplay(value: number) {
  return String(Math.floor(value)).padStart(5, "0")
}

function periodoLabel(periodo: string) {
  const [year, month] = periodo.split("-")
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString("es-CO", { month: "long", year: "numeric" })
}

export default async function MedidorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const profile = await getPortalProfile(user.id)
  if (!profile) redirect("/portal")

  const periodo = currentPeriodo()
  const today = new Date().getDate()
  const withinDeadline = today <= 10

  const empresaId = await getEmpresaCkreaId()

  const [medidor, history, prevRows, tarifaKwh] = await Promise.all([
    getPortalMedidorStatus(profile.unitId, periodo),
    getPortalMedidorHistory(profile.unitId, 6),
    execute(`
      SELECT lectura_actual::numeric AS lectura_actual
      FROM v2.lecturas_medidor
      WHERE local_id = '${profile.unitId}'::uuid AND periodo < '${periodo}'
      ORDER BY periodo DESC
      LIMIT 1
    `),
    getElectricityTarifaForUnit(empresaId, profile.unitId, periodo),
  ])
  const lecturaAnteriorRef = prevRows[0] ? Number(prevRows[0].lectura_actual) : 0

  return (
    <div className="space-y-5">
      <Link
        href="/portal"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al portal
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="h-5 w-5 text-slate-600" />
          <h1 className="text-lg font-bold text-slate-900">Lectura del Contador</h1>
        </div>
        <p className="text-sm text-slate-500">
          {periodoLabel(periodo)} · Local {profile.unitNumber}
        </p>
      </div>

      {/* Already submitted — full layout, locked */}
      {medidor.exists ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:items-stretch">
            {/* Left: photo or placeholder */}
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-slate-700">Foto del contador</p>
              {medidor.fotoDriveId ? (
                <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 min-h-[260px]">
                  <iframe
                    src={`https://drive.google.com/file/d/${medidor.fotoDriveId}/preview`}
                    width="100%"
                    height="100%"
                    allow="autoplay"
                    className="block h-full w-full"
                  />
                </div>
              ) : (
                <div className="flex-1 relative flex min-h-[260px] items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden">
                  <div className="flex flex-col items-center gap-3 p-6 text-center">
                    <Camera className="h-10 w-10 text-slate-200" />
                    <p className="text-sm text-slate-400">Sin foto adjunta</p>
                  </div>
                </div>
              )}
              <p className="text-xs text-slate-400">
                Para corregir la lectura, contacte al administrador.
              </p>
            </div>

            {/* Right: submitted reading read-only */}
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-4">
                <p className="text-xs font-medium text-slate-500 mb-2">Lectura anterior del mes</p>
                <p className="text-3xl font-bold tabular-nums text-slate-700">
                  {meterDisplay(lecturaAnteriorRef)}{" "}
                  <span className="text-base font-normal text-slate-400">kWh</span>
                </p>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-white px-4 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <p className="text-xs font-medium text-emerald-600">Lectura enviada este mes</p>
                </div>
                <p className="text-3xl font-bold tabular-nums text-slate-900">
                  {meterDisplay(medidor.lecturaActual ?? 0)}{" "}
                  <span className="text-base font-normal text-slate-400">kWh</span>
                </p>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-4">
                <p className="text-xs font-medium text-blue-600 mb-2">Consumo del mes</p>
                <p className="text-3xl font-bold tabular-nums text-blue-900">
                  {Math.floor((medidor.lecturaActual ?? 0) - lecturaAnteriorRef).toLocaleString("es-CO")}{" "}
                  <span className="text-base font-normal text-blue-400">kWh</span>
                </p>
              </div>

              {(() => {
                const consumo = Math.floor((medidor.lecturaActual ?? 0) - lecturaAnteriorRef)
                if (tarifaKwh > 0) {
                  const total = Math.round(consumo * tarifaKwh / 50) * 50
                  return (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4">
                      <p className="text-xs font-medium text-emerald-700 mb-2">Total energía a pagar</p>
                      <p className="text-3xl font-bold tabular-nums text-emerald-900">
                        $ {total.toLocaleString("es-CO")}
                      </p>
                    </div>
                  )
                }
                return (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs font-medium text-slate-500 mb-2">Total energía a pagar</p>
                    <p className="text-lg font-semibold text-slate-400">Tarifa pendiente de liquidación</p>
                    <p className="mt-1 text-xs text-slate-400">
                      El administrador aún no ha registrado la factura de este mes.
                    </p>
                  </div>
                )
              })()}

              <div className="mt-auto rounded-lg bg-slate-100 py-3 text-center text-sm font-medium text-slate-400">
                Podrás enviar una nueva lectura al inicio del próximo mes
              </div>
            </div>
          </div>

          <HistorialChart history={history} />
        </div>
      ) : !withinDeadline ? (
        /* Outside submission window — same layout, locked/empty */
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left: no photo */}
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-slate-700">Foto del contador</p>
              <div className="relative flex min-h-[260px] items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
                <div className="flex flex-col items-center gap-3 p-6 text-center">
                  <AlertCircle className="h-10 w-10 text-amber-300" />
                  <p className="text-sm font-medium text-slate-500">Lectura no enviada</p>
                  <p className="text-xs text-slate-400">
                    El plazo para {periodoLabel(periodo)} ya cerró.
                  </p>
                </div>
              </div>
              <p className="text-xs text-amber-600">
                Se aplicará cobro de 1.5× el promedio de los últimos 3 meses.
              </p>
            </div>

            {/* Right: empty state */}
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Lectura anterior:{" "}
                <span className="font-semibold text-slate-900">
                  {meterDisplay(lecturaAnteriorRef)} kWh
                </span>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <p className="text-xs font-medium text-amber-700">Sin lectura este mes</p>
                </div>
                <p className="text-3xl font-bold tabular-nums text-slate-400">— kWh</p>
              </div>
              <div className="mt-auto rounded-lg bg-slate-100 py-3 text-center text-sm font-medium text-slate-400">
                Podrás enviar tu lectura del día 1 al 10 del próximo mes
              </div>
            </div>
          </div>

          <HistorialChart history={history} />
        </div>
      ) : (
        /* Form */
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <p className="text-sm font-medium text-slate-700">Enviar lectura para {periodoLabel(periodo)}</p>
            <p className="mt-0.5 text-xs text-slate-400">
              Plazo: días 1–10 del mes · Hoy es día {today}
            </p>
          </div>
          <MedidorForm
            periodo={periodo}
            lecturaAnteriorRef={lecturaAnteriorRef}
            tarifaKwh={tarifaKwh}
            history={history}
          />
        </div>
      )}
    </div>
  )
}
