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
  piso: number
  techo: number
  recaudado: number
  ppOtorgado: number
  pendiente: number
}

type ChartRow = {
  mes: string
  piso: number
  techo: number
  techoExtra: number  // techo - piso, drawn as upside cap
  recaudado: number
  ppOtorgado: number
  pendiente: number
}

const EMERALD       = "#10b981"   // recaudo
const EMERALD_DARK  = "#059669"   // PP otorgado
const SLATE_NAVY    = "#1e3a5f"   // pendiente vs piso
const SLATE_LIGHT   = "#e2e8f0"   // techo upside (above piso)

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
  // % vs piso: cash only (piso already nets PP out — adding PP back double-counts).
  // % vs techo: cash + PP (techo is gross, PP comes back on top).
  const pctPiso  = d.piso  > 0 ? Math.round((d.recaudado / d.piso)  * 100) : 0
  const pctTecho = d.techo > 0 ? Math.round(((d.recaudado + d.ppOtorgado) / d.techo) * 100) : 0

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl" style={{ width: 240 }}>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600">{label}</p>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: SLATE_NAVY }} />
            Piso (esperado)
          </span>
          <span className="font-mono font-medium text-slate-900">{formatCOP(d.piso)}</span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: SLATE_LIGHT }} />
            Techo (máx)
          </span>
          <span className="font-mono text-slate-700">{formatCOP(d.techo)}</span>
        </div>
        <div className="my-1 border-t border-slate-100" />
        <div className="flex justify-between">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: EMERALD }} />
            Recaudo neto
          </span>
          <span className="font-mono font-medium text-emerald-700">{formatCOP(d.recaudado)}</span>
        </div>
        {d.ppOtorgado > 0 && (
          <div className="flex justify-between">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="inline-block h-2 w-2 rounded-sm" style={{ background: EMERALD_DARK }} />
              PP otorgado
            </span>
            <span className="font-mono font-medium text-emerald-900">{formatCOP(d.ppOtorgado)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-slate-100 pt-1">
          <span className={pctPiso >= 100 ? "text-emerald-600" : "text-slate-600"}>vs Piso</span>
          <span className={`font-mono font-semibold ${pctPiso >= 100 ? "text-emerald-600" : "text-slate-700"}`}>
            {pctPiso}%
          </span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>vs Techo</span>
          <span className="font-mono">{pctTecho}%</span>
        </div>
      </div>
    </div>
  )
}

function CustomLegend() {
  return (
    <div className="mt-1 flex flex-wrap justify-center gap-4 text-xs text-slate-600">
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: EMERALD }} />
        Recaudo neto
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: EMERALD_DARK }} />
        PP otorgado
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: SLATE_NAVY }} />
        Falta para piso
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: SLATE_LIGHT }} />
        Upside hasta techo
      </span>
    </div>
  )
}

export function RendimientoChart({ data }: { data: Row[] }) {
  const chartData: ChartRow[] = data.map((r) => ({
    mes:        r.mes,
    piso:       r.piso,
    techo:      r.techo,
    techoExtra: Math.max(r.techo - r.piso, 0),
    recaudado:  r.recaudado,
    ppOtorgado: r.ppOtorgado,
    pendiente:  r.pendiente,
  }))

  const max = Math.max(...data.map((d) => d.techo), 1)

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
              tick={{ fontSize: 10, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              domain={[0, max * 1.05]}
            />
            <YAxis
              type="category"
              dataKey="mes"
              tick={{ fontSize: 10, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
            {/* Stack to piso: recaudo + PP + pendiente = piso */}
            <Bar dataKey="recaudado"  stackId="a" fill={EMERALD}      radius={[4, 0, 0, 4]} maxBarSize={28} />
            <Bar dataKey="ppOtorgado" stackId="a" fill={EMERALD_DARK} radius={[0, 0, 0, 0]} maxBarSize={28} />
            <Bar dataKey="pendiente"  stackId="a" fill={SLATE_NAVY}   radius={[0, 0, 0, 0]} maxBarSize={28} />
            {/* Upside up to techo: drawn as a lighter cap after the piso stack */}
            <Bar dataKey="techoExtra" stackId="a" fill={SLATE_LIGHT}  radius={[0, 4, 4, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
