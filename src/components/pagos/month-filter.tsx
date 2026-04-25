"use client"

import { useRouter, usePathname } from "next/navigation"

function buildMonths(count = 12): { value: string; label: string }[] {
  const months: { value: string; label: string }[] = []
  const now = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const label = d.toLocaleDateString("es-CO", { month: "long", year: "numeric" })
    months.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) })
  }
  return months
}

export function MonthFilter({ selected }: { selected: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const months = buildMonths(12)

  return (
    <select
      value={selected}
      onChange={(e) => router.push(`${pathname}?month=${e.target.value}`)}
      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
    >
      {months.map((m) => (
        <option key={m.value} value={m.value}>{m.label}</option>
      ))}
    </select>
  )
}
