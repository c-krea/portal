"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { formatCOP } from "@/lib/formatters"

type Row = {
  mes: string
  canonBruto: number
  descuentos: number
  prontoPago: number
  baseNeta: number
  iva: number
  proyectado: number
}

const NAVY = "#1e3a5f"

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ payload: Row }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl" style={{ width: 220 }}>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Canon bruto</span>
          <span className="font-mono font-medium text-slate-800">{formatCOP(d.canonBruto)}</span>
        </div>
        <div className="flex justify-between text-rose-600">
          <span>− Descuentos</span>
          <span className="font-mono font-medium">{formatCOP(d.descuentos)}</span>
        </div>
        <div className="flex justify-between text-rose-600">
          <span>− Pronto pago</span>
          <span className="font-mono font-medium">{formatCOP(d.prontoPago)}</span>
        </div>
        <div className="flex justify-between border-t border-slate-100 pt-1">
          <span className="text-slate-600">Base neta</span>
          <span className="font-mono font-medium text-slate-800">{formatCOP(d.baseNeta)}</span>
        </div>
        <div className="flex justify-between text-amber-600">
          <span>+ IVA 19%</span>
          <span className="font-mono font-medium">{formatCOP(d.iva)}</span>
        </div>
        <div className="flex justify-between border-t border-slate-200 pt-1">
          <span className="font-semibold" style={{ color: NAVY }}>Total neto</span>
          <span className="font-mono font-bold" style={{ color: NAVY }}>{formatCOP(d.proyectado)}</span>
        </div>
      </div>
    </div>
  )
}

export function ProyeccionesChart({ data }: { data: Row[] }) {
  const max = Math.max(...data.map((d) => d.proyectado))

  return (
    <div className="mt-4 h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap="28%" margin={{ top: 4, right: 4, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="mes"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `$${(v / 1_000_000).toFixed(0)}M`}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            width={46}
            domain={[0, max * 1.1]}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9", radius: 8 }} />
          <Bar dataKey="proyectado" radius={[6, 6, 0, 0]} maxBarSize={48} fill={NAVY}>
            {data.map((_, i) => (
              <Cell key={i} fill={NAVY} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
