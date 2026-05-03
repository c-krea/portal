"use client"

import { useRouter } from "next/navigation"
import type { GastoPeriodo } from "@/lib/data/gastos"

const MES_NOMBRE: Record<string, string> = {
  "01": "Enero",    "02": "Febrero",   "03": "Marzo",
  "04": "Abril",    "05": "Mayo",      "06": "Junio",
  "07": "Julio",    "08": "Agosto",    "09": "Septiembre",
  "10": "Octubre",  "11": "Noviembre", "12": "Diciembre",
}

type Props = {
  periodos: GastoPeriodo[]
  selectedYear: string
  selectedMonth: string
}

export function PeriodoFilter({ periodos, selectedYear, selectedMonth }: Props) {
  const router = useRouter()

  const years = [...new Set(periodos.map((p) => p.value.slice(0, 4)))]
    .sort()
    .reverse()

  const months = periodos
    .filter((p) => p.value.startsWith(selectedYear))
    .map((p) => p.value.slice(5, 7))
    .sort()
    .reverse()

  const go = (year: string, month: string) =>
    router.push(`/gastos?year=${year}&month=${month}`)

  const handleYear = (year: string) => {
    const latest = periodos
      .filter((p) => p.value.startsWith(year))
      .map((p) => p.value.slice(5, 7))
      .sort()
      .reverse()[0] ?? "01"
    go(year, latest)
  }

  return (
    <div className="mb-5 flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Año
        </label>
        <select
          value={selectedYear}
          onChange={(e) => handleYear(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Mes
        </label>
        <select
          value={selectedMonth}
          onChange={(e) => go(selectedYear, e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {months.map((m) => (
            <option key={m} value={m}>{MES_NOMBRE[m] ?? m}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
