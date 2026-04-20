"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { submitLectura, type MedidorPortalState } from "./actions"
import { Camera, X } from "lucide-react"
import type { PortalMedidorHistoryRow } from "@/lib/data/portal"
import { HistorialChart } from "./chart"

const initial: MedidorPortalState = {}

function periodoLabel(periodo: string) {
  const [year, month] = periodo.split("-")
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString("es-CO", { month: "short", year: "numeric" })
}

export function MedidorForm({
  periodo,
  lecturaAnteriorRef,
  history,
}: {
  periodo: string
  lecturaAnteriorRef: number
  history: PortalMedidorHistoryRow[]
}) {
  const router = useRouter()
  const [state, action, pending] = useActionState(submitLectura, initial)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state.success) router.refresh()
  }, [state.success, router])
  const [preview, setPreview] = useState<string | null>(null)
  const [fotoBase64, setFotoBase64] = useState<string | null>(null)
  const [fotoMime, setFotoMime] = useState<string>("image/jpeg")
  const [dragging, setDragging] = useState(false)

  function applyFile(file: File) {
    setPreview(URL.createObjectURL(file))
    setFotoMime(file.type || "image/jpeg")
    const reader = new FileReader()
    reader.onload = (e) => setFotoBase64(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) applyFile(file)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave() {
    setDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) applyFile(file)
  }

  function clearPhoto() {
    setPreview(null)
    setFotoBase64(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }


  /* ── Form ── */
  return (
    <div className="space-y-5">
      <form action={action}>
        <input type="hidden" name="periodo" value={periodo} />
        {fotoBase64 && <input type="hidden" name="fotoBase64" value={fotoBase64} />}
        {fotoBase64 && <input type="hidden" name="fotoMime" value={fotoMime} />}

        {state.error && (
          <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {state.error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* ── Left: photo card ── */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-slate-700">Foto del contador</p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative flex flex-1 min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
                dragging
                  ? "border-blue-400 bg-blue-50"
                  : preview
                    ? "border-transparent p-0 overflow-hidden"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white p-6"
              }`}
            >
              {preview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Vista previa" className="h-full w-full rounded-xl object-cover" />
                  <div className="absolute inset-0 rounded-xl bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-sm font-semibold text-white">Cambiar foto</p>
                  </div>
                </>
              ) : (
                <>
                  <Camera className="h-10 w-10 text-slate-300 mb-3" />
                  <p className="text-sm font-medium text-slate-600">Foto o archivo del contador</p>
                  <p className="mt-1 text-xs text-slate-400 text-center">
                    Arrastra aquí o toque para seleccionar · JPG, PNG, PDF
                  </p>
                </>
              )}
            </div>

            {preview && (
              <button
                type="button"
                onClick={clearPhoto}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" />
                Quitar foto
              </button>
            )}

            <p className="text-xs text-slate-400">
              Opcional. Enviar foto acelera la aprobación automática.
            </p>
          </div>

          {/* ── Right: inputs ── */}
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Lectura anterior:{" "}
              <span className="font-semibold text-slate-900">
                {lecturaAnteriorRef.toLocaleString("es-CO")} kWh
              </span>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Lectura actual (kWh) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                name="lecturaActual"
                min={lecturaAnteriorRef}
                step="0.01"
                required
                placeholder={`Mínimo ${lecturaAnteriorRef}`}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-lg font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-slate-400">
                Número que aparece en la pantalla del contador eléctrico.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Notas (opcional)
              </label>
              <input
                type="text"
                name="notas"
                placeholder="Ej: Contador reemplazado, lectura inusual…"
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="mt-auto w-full rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              {pending ? "Enviando…" : "Enviar lectura"}
            </button>
          </div>

        </div>
      </form>

      <HistorialChart history={history} />
    </div>
  )
}
