export const dynamic = "force-dynamic"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getPortalProfile, getPortalMedidorHistory, getPortalMedidorRef } from "@/lib/data/portal"
import { MedidorForm, type UnitMedidorData } from "./form"
import { Zap } from "lucide-react"

function currentPeriodo() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
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
  const todayDay = new Date().getDate()
  const isMedidorDay = todayDay === 9

  // Load ref data + history for every unit in parallel
  const [refs, histories] = await Promise.all([
    Promise.all(profile.allUnitIds.map(id => getPortalMedidorRef(id, periodo))),
    Promise.all(profile.allUnitIds.map(id => getPortalMedidorHistory(id, 6))),
  ])

  const units: UnitMedidorData[] = profile.allUnitIds.map((unitId, i) => ({
    unitId,
    unitNumber:         profile.allUnits[i],
    lecturaAnteriorRef: refs[i].lecturaAnteriorRef,
    tarifaKwh:          refs[i].tarifaKwh,
    alreadySubmitted:   refs[i].alreadySubmitted,
    history:            histories[i],
  }))

  const chartSeries = units.map(u => ({
    label: `Local ${u.unitNumber}`,
    data:  u.history,
  }))

  return (
    <div className="space-y-4">

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="h-5 w-5 text-slate-600" />
          <h1 className="text-lg font-bold text-slate-900">Lectura del Contador</h1>
        </div>
        <p className="text-sm text-slate-500">
          {periodoLabel(periodo)} · {profile.allUnits.length > 1
            ? `Locales ${profile.allUnits.join(" · ")}`
            : `Local ${profile.unitNumber}`}
        </p>
      </div>

      {isMedidorDay ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <MedidorForm periodo={periodo} units={units} chartSeries={chartSeries} />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-center">
          <Zap className="mx-auto h-10 w-10 text-slate-300 mb-3" />
          <p className="font-semibold text-slate-700">Envío disponible solo el día 9 de cada mes</p>
          <p className="mt-1 text-sm text-slate-400">
            Vuelva el día 9 para registrar la lectura de su contador.
          </p>
        </div>
      )}

    </div>
  )
}
