import { Info } from "lucide-react"

// Instant-hover pattern (also used on Resumen) — native `title` needs the
// cursor to sit still ~1s before it shows, too easy to never trigger.
export function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex cursor-help">
      <Info className="h-3.5 w-3.5 text-slate-400" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-48 -translate-x-1/2 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-[11px] leading-snug text-slate-600 shadow-lg group-hover:block">
        {text}
      </span>
    </span>
  )
}
