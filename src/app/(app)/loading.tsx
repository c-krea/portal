export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-slate-500 animate-spin" />
        <span className="text-sm">Cargando...</span>
      </div>
    </div>
  )
}
