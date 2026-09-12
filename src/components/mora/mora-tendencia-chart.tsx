"use client"

import type { ReactNode } from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { formatCOP } from "@/lib/formatters"
import type { MoraTrendPoint } from "@/lib/data/mora"

function tooltipMoney(value: ReactNode): string {
  return formatCOP(Number(value ?? 0))
}

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

function formatPeriodo(periodo: string): string {
  const [y, m] = periodo.split("-")
  return `${MESES[Number(m) - 1]} ${y}`
}

// Short axis label: 21+ points no longer fit full "Ene 2026" labels at phone
// width (~350px). The tooltip keeps the full formatPeriodo above.
function formatPeriodoCorto(periodo: string): string {
  const [y, m] = periodo.split("-")
  return `${MESES[Number(m) - 1]} ${y.slice(2)}`
}

export function MoraTendenciaChart({ data }: { data: MoraTrendPoint[] }) {
  if (data.length < 1) {
    return (
      <p className="px-4 py-8 text-center text-sm text-slate-500">
        Aún no hay datos de mora este mes
      </p>
    )
  }
  // Thin to ~7 ticks so labels never collide and the card never scrolls sideways.
  const interval = Math.max(0, Math.ceil(data.length / 7) - 1)
  return (
    <ResponsiveContainer width="100%" height={208}>
      <LineChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="periodo"
          tickFormatter={formatPeriodoCorto}
          interval={interval}
          tick={{ fontSize: 11, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => `$${(v / 1_000_000).toFixed(0)}M`}
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          width={42}
        />
        <Tooltip formatter={tooltipMoney} labelFormatter={formatPeriodo} />
        <Line
          type="monotone"
          dataKey="saldoVencido"
          name="Mora"
          stroke="#e11d48"
          strokeWidth={2}
          dot={{ r: 3, fill: "#e11d48" }}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
