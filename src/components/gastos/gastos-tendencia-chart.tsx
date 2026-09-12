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

export type GastoTendenciaDatum = { periodo: string; total: number }

function tooltipMoney(value: ReactNode): string {
  return formatCOP(Number(value ?? 0))
}

export function GastosTendenciaChart({ data }: { data: GastoTendenciaDatum[] }) {
  if (data.length < 1) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="px-4 text-center text-xs text-slate-500">
          Aún no hay datos de gastos
        </p>
      </div>
    )
  }
  // NOTE: `periodo` already arrives as a display label ("Sep 2026") — that is
  // what getGastosHistorico returns via periodoLabel — so unlike Mora there is
  // no YYYY-MM → label conversion here. Axis and tooltip show it as-is.
  // height="100%" fills whatever the card gives it (its wrapper is a flex-1
  // child of a flex-col card, matching the Distribución card's height).
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="periodo"
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
        <Tooltip formatter={tooltipMoney} />
        <Line
          type="monotone"
          dataKey="total"
          name="Gastos"
          stroke="#2563eb"
          strokeWidth={2}
          dot={{ r: 3, fill: "#2563eb" }}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
