"use client"

import { BarChart } from "@tremor/react"
import { formatCOP } from "@/lib/formatters"

type CollectionRow = { mes: string; recaudado: number }
type ProyRow = { mes: string; proyectado: number; recaudado: number }

export function RecaudoChart({ data }: { data: CollectionRow[] }) {
  return (
    <BarChart
      data={data}
      index="mes"
      categories={["recaudado"]}
      colors={["emerald"]}
      valueFormatter={(v) => formatCOP(v)}
      showLegend={false}
      showAnimation
      className="h-56"
    />
  )
}

export function ProyectadoVsRealChart({ data }: { data: ProyRow[] }) {
  return (
    <BarChart
      data={data}
      index="mes"
      categories={["proyectado", "recaudado"]}
      colors={["slate", "emerald"]}
      valueFormatter={(v) => formatCOP(v)}
      showLegend
      showAnimation
      className="h-56"
    />
  )
}
