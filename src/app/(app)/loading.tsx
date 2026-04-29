export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Title placeholder */}
      <div className="mb-6 h-8 w-64 rounded-lg bg-slate-200" />

      {/* 4 KPI card skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-3 w-32 rounded bg-slate-200" />
            <div className="mt-3 h-7 w-40 rounded bg-slate-200" />
            <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100" />
          </div>
        ))}
      </div>

      {/* Bottom row skeleton */}
      <div className="mt-4 flex flex-col lg:flex-row gap-4">
        <div className="h-[280px] lg:h-[480px] w-full lg:w-[350px] shrink-0 rounded-xl border border-slate-200 bg-white p-5" />
        <div className="h-[400px] lg:h-[480px] flex-1 rounded-xl border border-slate-200 bg-white p-5" />
      </div>
    </div>
  )
}
