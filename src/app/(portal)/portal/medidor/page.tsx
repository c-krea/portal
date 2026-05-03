export const dynamic = "force-dynamic"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getPortalProfile, getPortalMedidorHistory } from "@/lib/data/portal"
import { HistorialChart } from "./chart"
import { Zap, Clock } from "lucide-react"

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
  const histories = await Promise.all(
    profile.allUnitIds.map(id => getPortalMedidorHistory(id, 6))
  )
  const chartSeries = profile.allUnits.map((unit, i) => ({
    label: `Local ${unit}`,
    data: histories[i],
  }))

  return (
    <div className="space-y-4">

      {/* Header */}
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

      {/* Phase 2 — Próximamente — WOR-79 */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <Clock className="h-7 w-7 text-slate-400" />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-700">Próximamente</p>
            <p className="mt-1 text-sm text-slate-400">
              El envío de lecturas del contador estará disponible en una próxima versión.
            </p>
          </div>
          <p className="text-xs text-slate-300 mt-2">
            Para enviar su lectura, comuníquese con la administración.
          </p>
        </div>
      </div>

      {/* Historial de uso — always visible */}
      <HistorialChart series={chartSeries} />

    </div>
  )
}
