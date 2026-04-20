"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { formatCOP } from "@/lib/formatters"
import type { GastoChartRow } from "@/lib/data/gastos"

const CATS = [
  { key: "nomina",              label: "Nómina",             color: "#2563eb" },
  { key: "vigilancia",          label: "Vigilancia",         color: "#e11d48" },
  { key: "reparaciones",        label: "Reparaciones",       color: "#f97316" },
  { key: "servicios_publicos",  label: "Servicios Públicos", color: "#0891b2" },
  { key: "aseo_cafeteria",      label: "Aseo / Cafetería",   color: "#10b981" },
  { key: "publicidad",          label: "Publicidad",         color: "#7c3aed" },
  { key: "impuestos",           label: "Impuestos",          color: "#64748b" },
  { key: "otros",               label: "Otros",              color: "#a8a29e" },
] as const

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { color: string } }>
}) {
  if (!active || !payload?.length) return null
  const { name, value, payload: p } = payload[0]
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-xl text-xs">
      <span className="flex items-center gap-2 font-medium text-slate-800">
        <span className="inline-block h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: p.color }} />
        {name}
      </span>
      <span className="mt-1 block font-mono font-semibold text-slate-900">{formatCOP(value)}</span>
    </div>
  )
}

export function GastosChart({ data }: { data: GastoChartRow }) {
  const pieData = CATS
    .map(({ key, label, color }) => ({ name: label, value: data[key], color }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)

  const total = pieData.reduce((s, d) => s + d.value, 0)

  if (total === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        Sin gastos registrados para este período
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Pie */}
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              innerRadius={0}
              outerRadius="72%"
              paddingAngle={2}
              strokeWidth={0}
              startAngle={90}
              endAngle={-270}
            >
              {pieData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-3 flex shrink-0 flex-wrap gap-x-4 gap-y-1.5">
        {pieData.map((d) => (
          <span key={d.name} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: d.color }}
            />
            {d.name} · {Math.round((d.value / total) * 100)}%
          </span>
        ))}
      </div>
    </div>
  )
}
