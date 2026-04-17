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
  proyectado: number    // tooltip reference only
  recaudado: number     // emerald bottom  — cash recibido
  ppOtorgado: number    // dark emerald middle — PP descuento concedido
  pendiente: number     // navy top — realmente sin pagar
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
            {/* Stacked bottom → top: cash · PP · pendiente */}
            <Bar dataKey="recaudado"  stackId="a" fill={EMERALD}      radius={[0, 0, 4, 4]} maxBarSize={40} />
            <Bar dataKey="ppOtorgado" stackId="a" fill={EMERALD_DARK} radius={[0, 0, 0, 0]} maxBarSize={40} />
            <Bar dataKey="pendiente"  stackId="a" fill={NAVY}         radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
