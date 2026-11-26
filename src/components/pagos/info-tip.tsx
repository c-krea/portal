"use client"

import { useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Info } from "lucide-react"

const WIDTH = 224 // px, tooltip width
const MARGIN = 8 // px from the viewport edge

// Instant-hover pattern — native `title` needs the cursor to sit still ~1s
// before it shows, too easy to never trigger. The bubble is portalled to <body>
// with fixed positioning, so a card's overflow-hidden can never clip it, and it
// is clamped to the viewport (flips below the icon near the top edge).
export function InfoTip({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number; below: boolean } | null>(null)

  function show() {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const center = r.left + r.width / 2
    const left = Math.min(Math.max(center - WIDTH / 2, MARGIN), window.innerWidth - WIDTH - MARGIN)
    const below = r.top < 120
    setPos({ left, top: below ? r.bottom + 8 : r.top - 8, below })
  }

  return (
    <span
      ref={ref}
      tabIndex={0}
      aria-label={text}
      onMouseEnter={show}
      onMouseLeave={() => setPos(null)}
      onFocus={show}
      onBlur={() => setPos(null)}
      className="inline-flex cursor-help rounded-full outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
    >
      <Info className="h-3.5 w-3.5 text-slate-400" />
      {pos &&
        createPortal(
          <span
            role="tooltip"
            style={{ left: pos.left, top: pos.top, width: WIDTH, transform: pos.below ? undefined : "translateY(-100%)" }}
            className="pointer-events-none fixed z-[100] rounded-md border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-normal normal-case leading-snug tracking-normal text-slate-600 shadow-lg"
          >
            {text}
          </span>,
          document.body,
        )}
    </span>
  )
}
