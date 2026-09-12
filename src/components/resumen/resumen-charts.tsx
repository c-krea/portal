"use client"

import type { ReactNode } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { formatCOP } from "@/lib/formatters"

export type SemanaDatum = { semana: string; total: number; fill?: string }
export type OrigenDatum = { name: string; value: number; fill: string }

function compactCOP(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)} M`
  return formatCOP(value)
}

function tooltipMoney(value: ReactNode): string {
  return formatCOP(Number(value ?? 0))
}

export function SemanalChart({ data }: { data: SemanaDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={208}>
      <BarChart data={data} margin={{ top: 22, right: 12, left: 0, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="semana"
          tick={{ fontSize: 11, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => `$${(v / 1_000_000).toFixed(0)}M`}
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          width={42}
        />
        <Tooltip formatter={tooltipMoney} cursor={{ fill: "#eff6ff" }} />
        <Bar dataKey="total" fill="#1e40af" radius={[4, 4, 0, 0]} maxBarSize={56}>
          {data.map((d) => (
            <Cell key={d.semana} fill={d.fill ?? "#1e40af"} />
          ))}
          <LabelList
            dataKey="total"
            position="top"
            formatter={(v: ReactNode) => compactCOP(Number(v ?? 0))}
            style={{ fontSize: 11, fill: "#1e40af", fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function OrigenChart({ data }: { data: OrigenDatum[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  // The first slice is the one the page is about — what actually came in.
  // Its share is the headline; the ring is just how it sits against the rest.
  const principal = data[0]
  const pctPrincipal = total > 0 && principal ? Math.round((principal.value / total) * 100) : 0
  return (
    <div className="flex flex-wrap items-center gap-6 sm:gap-8">
      <div className="relative h-[190px] w-[190px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={92}
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
          <span className="text-[30px] font-bold leading-none tracking-tight tabular-nums text-slate-900">
            {pctPrincipal}%
          </span>
          <span className="mt-1 text-[11px] text-slate-500">
            {principal ? principal.name.toLowerCase() : ""}
          </span>
        </div>
      </div>
      <ul className="flex min-w-0 flex-1 flex-col gap-4">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2.5">
            <span
              className="h-3 w-3 shrink-0 rounded-[3px]"
              style={{ background: d.fill }}
            />
            <div className="min-w-0">
              <p className="text-sm text-slate-600">{d.name}</p>
              <p className="text-lg font-bold leading-tight tabular-nums text-slate-900">
                {formatCOP(d.value)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
