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
  ppOtorgado: number
  pendiente: number
}

type ChartRow = {
  mes: string
  proyectado: number
  recaudado: number
  ppOtorgado: number
  pendiente: number
}

const EMERALD      = "#10b981"
const EMERALD_DARK = "#059669"
const NAVY         = "#1e3a5f"

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
  const totalCobrado = d.recaudado + d.ppOtorgado
  const pct = d.proyectado > 0 ? Math.round((totalCobrado / d.proyectado) * 100) : 0

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl" style={{ width: 230 }}>
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
            Recaudo neto
          </span>
          <span className="font-mono font-medium text-emerald-700">{formatCOP(d.recaudado)}</span>
        </div>
        {d.ppOtorgado > 0 && (
          <div className="flex justify-between">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="inline-block h-2 w-2 rounded-sm" style={{ background: EMERALD_DARK }} />
              PP otorgado
            </span>
            <span className="font-mono font-medium text-emerald-900">{formatCOP(d.ppOtorgado)}</span>
          </div>
        )}
        {d.pendiente > 0 && (
          <div className="flex justify-between">
            <span className="text-slate-400">Sin cobrar</span>
            <span className="font-mono text-slate-500">{formatCOP(d.pendiente)}</span>
          </div>
        )}
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
        <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: EMERALD }} />
        Recaudo neto
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: EMERALD_DARK }} />
        PP otorgado
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: NAVY }} />
        Pendiente
      </span>
    </div>
  )
}

export function RendimientoChart({ data }: { data: Row[] }) {
  const chartData: ChartRow[] = data.map((r) => ({
    mes:        r.mes,
    proyectado: r.proyectado,
    recaudado:  r.recaudado,
    ppOtorgado: r.ppOtorgado,
    pendiente:  r.pendiente,
  }))

  const max = Math.max(...data.map((d) => d.proyectado), 1)

  return (
    <div style={{ width: "100%" }}>
      <CustomLegend />
      <div style={{ width: "100%", height: 380 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            barCategoryGap="25%"
            margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(v) => `$${(v / 1_000_000).toFixed(0)}M`}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              domain={[0, max * 1.12]}
            />
            <YAxis
              type="category"
              dataKey="mes"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
            <Bar dataKey="recaudado"  stackId="a" fill={EMERALD}      radius={[4, 0, 0, 4]} maxBarSize={28} />
            <Bar dataKey="ppOtorgado" stackId="a" fill={EMERALD_DARK} radius={[0, 0, 0, 0]} maxBarSize={28} />
            <Bar dataKey="pendiente"  stackId="a" fill={NAVY}         radius={[0, 4, 4, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
