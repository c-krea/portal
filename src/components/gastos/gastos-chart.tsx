"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { formatCOP } from "@/lib/formatters"
import type { GastoChartRow } from "@/lib/data/gastos"

const CATS = [
  { key: "vigilancia",         label: "Vigilancia",         color: "#e11d48" },
  { key: "reparaciones",       label: "Reparaciones",       color: "#f97316" },
  { key: "nomina",             label: "Nómina",             color: "#2563eb" },
  { key: "servicios_publicos", label: "Servicios Públicos", color: "#0891b2" },
  { key: "aseo_cafeteria",     label: "Aseo / Cafetería",   color: "#10b981" },
  { key: "publicidad",         label: "Publicidad",         color: "#7c3aed" },
  { key: "impuestos",          label: "Impuestos",          color: "#64748b" },
  { key: "otros",              label: "Otros",              color: "#a8a29e" },
] as const

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ color: string; name: string; value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0)
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl" style={{ minWidth: 220 }}>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <div className="space-y-1 text-xs">
        {[...payload].reverse().map((p) => (
          <div key={p.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="inline-block h-2 w-2 rounded-sm shrink-0" style={{ background: p.color }} />
              {p.name}
            </span>
            <span className="font-mono font-medium text-slate-800">{formatCOP(p.value)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-slate-100 pt-1 font-semibold">
          <span className="text-slate-600">Total</span>
          <span className="font-mono text-slate-900">{formatCOP(total)}</span>
        </div>
      </div>
    </div>
  )
}

export function GastosChart({ data }: { data: GastoChartRow[] }) {
  const max = Math.max(...data.map((d) => d.total), 1)

  return (
    <div className="flex h-full flex-col">
      {/* Legend */}
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1">
        {CATS.map(({ key, label, color }) => (
          <span key={key} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="inline-block h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>

      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="40%" margin={{ top: 4, right: 4, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="periodo"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `$${(v / 1_000_000).toFixed(0)}M`}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              width={48}
              domain={[0, max * 1.1]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc", radius: 4 }} />
            {CATS.map(({ key, label, color }, i) => (
              <Bar
                key={key}
                dataKey={key}
                name={label}
                stackId="a"
                fill={color}
                maxBarSize={52}
                radius={i === CATS.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
