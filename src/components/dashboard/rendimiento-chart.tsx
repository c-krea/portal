"use client"

import { BarChart } from "@tremor/react"
import { formatCOP } from "@/lib/formatters"

type ChartRow = {
  mes: string
  proyectado: number
  recibido: number
}

export function RendimientoChart({ data }: { data: ChartRow[] }) {
  return (
    <BarChart
      data={data}
      index="mes"
      categories={["recibido", "proyectado"]}
      colors={["blue", "slate"]}
      valueFormatter={(v) => formatCOP(v)}
      showLegend
      showAnimation
      className="h-48 mt-4"
    />
  )
}
