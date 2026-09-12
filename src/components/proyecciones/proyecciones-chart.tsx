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

export type ProyeccionRecaudoMes = {
  mes: string
  esperado: number
  // Cash collected ON this month's invoices (any arrival date). Null for months
  // after the current one — no zero-height solid bar (it would read as a miss).
  recaudado: number | null
  esMesEnCurso: boolean
}

const PROYECCION_NAVY  = "#1e3a5f"
const PROYECCION_LIGHT = "#c9d6e8"

export { PROYECCION_NAVY, PROYECCION_LIGHT }

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ payload: ProyeccionRecaudoMes }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const porCobrar = d.recaudado == null ? null : Math.max(0, d.esperado - d.recaudado)
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl" style={{ width: 250 }}>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Esperado</span>
          <span className="font-mono font-medium text-slate-800">{formatCOP(d.esperado)}</span>
        </div>
        {d.recaudado != null && (
          <>
            <div className="flex justify-between">
              <span style={{ color: PROYECCION_NAVY }}>Recaudado de esas facturas</span>
              <span className="font-mono font-bold" style={{ color: PROYECCION_NAVY }}>{formatCOP(d.recaudado)}</span>
            </div>
            {porCobrar != null && (
              <div className="flex justify-between border-t border-slate-100 pt-1 text-slate-500">
                <span>Aún por cobrar</span>
                <span className="font-mono font-medium">{formatCOP(porCobrar)}</span>
              </div>
            )}
          </>
        )}
        {d.esMesEnCurso && (
          <p className="border-t border-slate-100 pt-1 text-[11px] leading-snug text-slate-400">
            Mes en curso: las facturas en su mayoría aún no vencen, la barra sólida es parcial.
          </p>
        )}
      </div>
    </div>
  )
}

export function ProyeccionesChart({ data }: { data: ProyeccionRecaudoMes[] }) {
  const max = Math.max(...data.map((d) => d.esperado))

  return (
    <div className="mt-4 overflow-x-auto">
      <div style={{ minWidth: 540, height: 208 }}>
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
          <Bar dataKey="esperado" name="Esperado" radius={[6, 6, 0, 0]} maxBarSize={40} fill={PROYECCION_LIGHT} />
          <Bar dataKey="recaudado" name="Recaudado" radius={[6, 6, 0, 0]} maxBarSize={40} fill={PROYECCION_NAVY} />
        </BarChart>
      </ResponsiveContainer>
      </div>
    </div>
  )
}
