"use client"

import type { ReactNode } from "react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { formatCOP } from "@/lib/formatters"

export type GastoDistribucionDatum = { name: string; value: number; fill: string }

function tooltipMoney(value: ReactNode): string {
  return formatCOP(Number(value ?? 0))
}

// Donut: 170px geometry, center "Total" overlay, colored-bar legend with
// % + COP amount.
export function GastosDistribucionChart({ data }: { data: GastoDistribucionDatum[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-slate-500">
        Sin gastos registrados para este período
      </p>
    )
  }
  return (
    <div className="flex items-center gap-8">
      <div className="relative h-[170px] w-[170px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.fill} />
              ))}
            </Pie>
            <Tooltip formatter={tooltipMoney} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Total</span>
          <span className="text-sm font-bold text-slate-900 tabular-nums">{formatCOP(total)}</span>
        </div>
      </div>
      <ul className="flex min-w-0 flex-1 flex-col gap-3">
        {data.map((d) => (
          <li key={d.name} className="flex gap-2.5">
            <span className="w-1 self-stretch rounded-full" style={{ background: d.fill }} />
            <div className="min-w-0">
              <p className="text-lg font-bold leading-tight text-slate-900 tabular-nums">
                {formatCOP(d.value)}{" "}
                <span className="text-sm font-medium text-slate-400">
                  ({total > 0 ? Math.round((d.value / total) * 100) : 0}%)
                </span>
              </p>
              <p className="text-sm text-slate-500">{d.name}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
