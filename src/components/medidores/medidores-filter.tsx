"use client"

import { useRouter } from "next/navigation"
import { Download } from "lucide-react"

type Periodo = { label: string; value: string }

type Props = {
  years: number[]
  periodos: Periodo[]
  selectedYear: number
  selectedPeriodo: string
}

export function MedidoresFilter({ years, periodos, selectedYear, selectedPeriodo }: Props) {
  const router = useRouter()

  const handleYear = (year: string) => {
    const y = Number(year)
    const now = new Date()
    const maxMonth = y === now.getFullYear() ? now.getMonth() + 1 : 12
    const latest = `${y}-${String(maxMonth).padStart(2, "0")}`
    router.push(`/medidores?year=${y}&periodo=${latest}`)
  }

  const handlePeriodo = (periodo: string) => {
    router.push(`/medidores?year=${selectedYear}&periodo=${periodo}`)
  }

  return (
    <div className="mb-5 flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Año</label>
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
        <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Mes</label>
        <select
          value={selectedPeriodo}
          onChange={(e) => handlePeriodo(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {periodos.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      <a
        href={`/api/medidores/export-energia?periodo=${selectedPeriodo}`}
        className="self-end inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-100 transition-colors"
      >
        <Download className="h-4 w-4" />
        Exportar Excel
      </a>
    </div>
  )
}
