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

type Row = {
  mes: string
  proyectado: number
  recaudado: number
}

type ChartRow = {
  mes: string
  proyectado: number   // kept for tooltip
  recaudado: number    // emerald bottom slice
  resto: number        // navy top slice  = proyectado - recaudado
}

const NAVY    = "#1e3a5f"
const EMERALD = "#10b981"

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ payload: ChartRow }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const pct = d.proyectado > 0 ? Math.round((d.recaudado / d.proyectado) * 100) : 0

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl" style={{ width: 210 }}>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: NAVY }} />
            Proyectado
          </span>
          <span className="font-mono font-medium text-slate-800">{formatCOP(d.proyectado)}</span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: EMERALD }} />
            Recaudado
          </span>
          <span className="font-mono font-medium text-emerald-700">{formatCOP(d.recaudado)}</span>
        </div>
        <div className="flex justify-between border-t border-slate-100 pt-1">
          <span className={pct >= 100 ? "text-emerald-600" : "text-slate-400"}>Cumplimiento</span>
          <span className={`font-mono font-semibold ${pct >= 100 ? "text-emerald-600" : "text-slate-600"}`}>
            {pct}%
          </span>
        </div>
      </div>
    </div>
  )
}

function CustomLegend() {
  return (
    <div className="mt-1 flex justify-center gap-5 text-xs text-slate-500">
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: NAVY }} />
        Proyectado
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: EMERALD }} />
        Recaudado
      </span>
    </div>
  )
}

export function RendimientoChart({ data }: { data: Row[] }) {
  const chartData: ChartRow[] = data.map((r) => ({
    mes:        r.mes,
    proyectado: r.proyectado,
    recaudado:  Math.min(r.recaudado, r.proyectado),
    resto:      Math.max(r.proyectado - r.recaudado, 0),
  }))

  const max = Math.max(...data.map((d) => d.proyectado), 1)

  return (
    <div className="flex h-full flex-col">
      <CustomLegend />
      <div className="min-h-0 flex-1 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="35%" margin={{ top: 4, right: 4, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="mes"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `$${(v / 1_000_000).toFixed(0)}M`}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              width={44}
              domain={[0, max * 1.12]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc", radius: 6 }} />
            {/* Stacked: emerald (recaudado) fills from bottom, navy (resto) sits on top */}
            <Bar dataKey="recaudado" stackId="a" fill={EMERALD} radius={[0, 0, 4, 4]} maxBarSize={40} />
            <Bar dataKey="resto"     stackId="a" fill={NAVY}    radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
