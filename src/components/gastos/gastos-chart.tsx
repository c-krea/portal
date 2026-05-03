"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { formatCOP } from "@/lib/formatters"
import type { GastoChartRow } from "@/lib/data/gastos"
import { CAT_COLORS } from "./cat-colors"

const CATS = [
  { key: "nomina",             label: "Nómina"             },
  { key: "vigilancia",         label: "Vigilancia"         },
  { key: "reparaciones",       label: "Reparaciones"       },
  { key: "servicios_publicos", label: "Servicios Públicos" },
  { key: "aseo_cafeteria",     label: "Aseo / Cafetería"   },
  { key: "publicidad",         label: "Publicidad"         },
  { key: "impuestos",          label: "Impuestos"          },
  { key: "otros",              label: "Otros"              },
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
    .map(({ key, label }) => ({ name: label, value: data[key], color: CAT_COLORS[key] ?? "#94a3b8" }))
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
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-[160px]">
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

      <div className="mt-3 flex shrink-0 flex-wrap gap-x-4 gap-y-1.5">
        {pieData.map((d) => (
          <span key={d.name} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: d.color }} />
            {d.name}
          </span>
        ))}
      </div>
    </div>
  )
}
