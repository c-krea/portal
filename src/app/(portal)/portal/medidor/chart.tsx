"use client"

import type { PortalMedidorHistoryRow } from "@/lib/data/portal"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"]

function periodoShort(periodo: string) {
  const [year, month] = periodo.split("-")
  const date = new Date(Number(year), Number(month) - 1, 1)
  const mon = date.toLocaleDateString("es-CO", { month: "short" })
  const yr = String(Number(year)).slice(-2)
  return `${mon} '${yr}`
}

export function HistorialChart({
  series,
}: {
  series: { label: string; data: PortalMedidorHistoryRow[] }[]
}) {
  // Union of all periods, sorted ascending
  const allPeriodos = Array.from(
    new Set(series.flatMap((s) => s.data.map((r) => r.periodo)))
  ).sort()

  const W = 500
  const H = 120
  const padX = 24
  const padTop = 24
  const padBottom = 28

  // Scale across all series
  const allValues = series.flatMap((s) => s.data.map((r) => r.kwh ?? 0)).filter((v) => v > 0)
  const minV = allValues.length > 0 ? Math.min(...allValues) : 0
  const maxV = allValues.length > 0 ? Math.max(...allValues, minV + 1) : 1
  const n = allPeriodos.length

  function cx(i: number) {
    return padX + (i / Math.max(n - 1, 1)) * (W - padX * 2)
  }
  function cy(v: number) {
    return padTop + (1 - (v - minV) / (maxV - minV)) * (H - padTop - padBottom)
  }

  const hasData = allPeriodos.length > 0

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Historial de uso
        </p>
        {series.length > 1 && (
          <div className="flex items-center gap-3">
            {series.map((s, i) => (
              <div key={s.label} className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-xs text-slate-500">{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {!hasData ? (
        <div className="flex h-28 items-center justify-center">
          <p className="text-sm text-slate-400">Sin historial de lecturas aún</p>
        </div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 140 }}>
          <defs>
            {series.map((_, i) => (
              <linearGradient key={i} id={`areaGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS[i % COLORS.length]} />
                <stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {series.map((s, si) => {
            const color = COLORS[si % COLORS.length]
            const kwhMap = new Map(s.data.map((r) => [r.periodo, r.kwh]))
            const points = allPeriodos
              .map((p, i) => {
                const kwh = kwhMap.get(p)
                return kwh != null ? { i, kwh } : null
              })
              .filter(Boolean) as { i: number; kwh: number }[]

            if (points.length === 0) return null

            const linePath = points
              .map(({ i, kwh }, j) => `${j === 0 ? "M" : "L"} ${cx(i)} ${cy(kwh)}`)
              .join(" ")
            const areaPath =
              linePath +
              ` L ${cx(points[points.length - 1].i)} ${H - padBottom} L ${cx(points[0].i)} ${H - padBottom} Z`

            return (
              <g key={si}>
                <path d={areaPath} fill={`url(#areaGrad${si})`} opacity="0.15" />
                <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                {points.map(({ i, kwh }) => (
                  <g key={i}>
                    <text
                      x={cx(i)}
                      y={cy(kwh) - 8}
                      textAnchor="middle"
                      fontSize="10"
                      fill={color}
                      fontFamily="inherit"
                      opacity="0.8"
                    >
                      {kwh.toLocaleString("es-CO")}
                    </text>
                    <circle cx={cx(i)} cy={cy(kwh)} r="4" fill={color} stroke="white" strokeWidth="2" />
                  </g>
                ))}
              </g>
            )
          })}

          {/* X-axis labels */}
          {allPeriodos.map((p, i) => (
            <text key={p} x={cx(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="inherit">
              {periodoShort(p)}
            </text>
          ))}
        </svg>
      )}

      <p className="mt-1 text-xs text-slate-400">kWh consumidos por mes</p>
    </div>
  )
}
