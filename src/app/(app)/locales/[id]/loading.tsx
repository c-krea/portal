// The (app)-level loading.tsx never fires on /locales → /locales/[id]: the
// "locales" segment it wraps does not change, so the list stayed frozen on
// screen until the detail finished loading. This boundary sits on [id] itself.
export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Back button + title placeholder */}
      <div className="mb-3 h-4 w-20 rounded bg-slate-200" />
      <div className="mb-6 h-8 w-64 rounded-lg bg-slate-200" />

      <div className="space-y-6">
        {/* Info + contracts cards */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-[220px] rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="h-3 w-32 rounded bg-slate-200" />
              <div className="mt-5 space-y-3">
                <div className="h-4 w-3/4 rounded bg-slate-100" />
                <div className="h-4 w-1/2 rounded bg-slate-100" />
                <div className="h-4 w-2/3 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="h-3 w-24 rounded bg-slate-200" />
              <div className="mt-2 h-6 w-32 rounded bg-slate-200" />
            </div>
          ))}
        </div>

        {/* Cartera / payments table */}
        <div className="h-[360px] rounded-xl border border-slate-200 bg-white p-5 shadow-sm" />
      </div>
    </div>
  )
}
