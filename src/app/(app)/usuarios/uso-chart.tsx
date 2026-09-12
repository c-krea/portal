"use client"

import type { ReactNode } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

export type UsoDatum = { name: string; value: number; fill: string }

function tooltipCount(value: ReactNode): string {
  return `${Number(value ?? 0)} inquilinos`
}

export function UsuariosUsoChart({ data }: { data: UsoDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={208}>
      <BarChart data={data} margin={{ top: 22, right: 12, left: 0, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
          interval={0}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          width={28}
          allowDecimals={false}
        />
        <Tooltip formatter={tooltipCount} cursor={{ fill: "#eff6ff" }} />
        <Bar dataKey="value" name="Inquilinos" radius={[4, 4, 0, 0]} maxBarSize={56}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.fill} />
          ))}
          <LabelList
            dataKey="value"
            position="top"
            style={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
