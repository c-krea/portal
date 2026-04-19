"use client"

import type { PortalMedidorHistoryRow } from "@/lib/data/portal"

function periodoShort(periodo: string) {
  const [year, month] = periodo.split("-")
  const date = new Date(Number(year), Number(month) - 1, 1)
  const mon = date.toLocaleDateString("es-CO", { month: "short" })
  const yr = String(Number(year)).slice(-2)
  return `${mon} '${yr}`
}

export function HistorialChart({ history }: { history: PortalMedidorHistoryRow[] }) {
  const ordered = [...history].reverse()

  const W = 500
  const H = 120
  const padX = 24
  const padTop = 24
  const padBottom = 28

  const values = ordered.map((r) => r.kwh ?? 0)
  const minV = Math.min(...values)
  const maxV = Math.max(...values, minV + 1)
  const n = ordered.length

  function cx(i: number) {
    return padX + (i / Math.max(n - 1, 1)) * (W - padX * 2)
  }
  function cy(v: number) {
    return padTop + (1 - (v - minV) / (maxV - minV)) * (H - padTop - padBottom)
  }

  const linePath = ordered
    .map((r, i) => `${i === 0 ? "M" : "L"} ${cx(i)} ${cy(r.kwh ?? 0)}`)
    .join(" ")

  const areaPath =
    linePath +
    ` L ${cx(n - 1)} ${H - padBottom} L ${cx(0)} ${H - padBottom} Z`

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Historial de uso
      </p>

      {ordered.length === 0 ? (
        <div className="flex h-28 items-center justify-center">
          <p className="text-sm text-slate-400">Sin historial de lecturas aún</p>
        </div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 140 }}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#areaGrad)" opacity="0.3" />
          <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {ordered.map((row, i) => (
            <g key={row.periodo}>
              <text x={cx(i)} y={cy(row.kwh ?? 0) - 8} textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="inherit">
                {row.kwh != null ? row.kwh.toLocaleString("es-CO") : "—"}
              </text>
              <circle cx={cx(i)} cy={cy(row.kwh ?? 0)} r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />
              <text x={cx(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="inherit">
                {periodoShort(row.periodo)}
              </text>
            </g>
          ))}
        </svg>
      )}

      <p className="mt-1 text-xs text-slate-400">kWh consumidos por mes</p>
    </div>
  )
}
