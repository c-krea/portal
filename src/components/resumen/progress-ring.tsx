// Percentage ring for the /resumen cards. Plain SVG, server-renderable.
// The arc is capped at 100%; the label shows the real (possibly >100) value.
export function ProgressRing({
  pct,
  color,
  size = 112,
  stroke = 10,
  labelClassName = "text-xl",
}: {
  pct: number
  color: string
  size?: number
  stroke?: number
  labelClassName?: string
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const filled = (Math.min(Math.max(pct, 0), 100) / 100) * c
  return (
    // Sized in rem (size/16) so the ring follows the app's fluid root font size.
    <div className="relative shrink-0" style={{ width: `${size / 16}rem`, height: `${size / 16}rem` }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c}`}
        />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center font-semibold tabular-nums text-slate-900 ${labelClassName}`}
      >
        {Math.round(pct)}%
      </span>
    </div>
  )
}
