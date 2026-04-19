"use client"

import { useActionState, useRef, useState } from "react"
import { submitLectura, type MedidorPortalState } from "./actions"
import { Camera, CheckCircle2, X } from "lucide-react"
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
  const [state, action, pending] = useActionState(submitLectura, initial)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [submittedReading, setSubmittedReading] = useState<string>("")

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
  }

  function clearPhoto() {
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(e.currentTarget)
    setSubmittedReading(fd.get("lecturaActual") as string)
  }

  /* ── Success / locked state ── */
  if (state.success) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left: photo preview or checkmark */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-slate-700">Foto del contador</p>
            <div className="relative flex min-h-[260px] items-center justify-center rounded-xl border-2 border-dashed overflow-hidden border-emerald-200 bg-emerald-50">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Foto enviada" className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-3 p-6 text-center">
                  <CheckCircle2 className="h-12 w-12 text-emerald-400" />
                  <p className="text-sm text-emerald-700">Sin foto adjunta</p>
                </div>
              )}
            </div>
            <p className="text-xs text-emerald-600 font-medium">{state.message}</p>
          </div>

          {/* Right: submitted reading read-only */}
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Lectura anterior:{" "}
              <span className="font-semibold text-slate-900">
                {lecturaAnteriorRef.toLocaleString("es-CO")} kWh
              </span>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-white px-4 py-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <p className="text-xs font-medium text-emerald-600">Lectura enviada este mes</p>
              </div>
              <p className="text-3xl font-bold tabular-nums text-slate-900">
                {submittedReading ? Number(submittedReading).toLocaleString("es-CO") : "—"}{" "}
                <span className="text-base font-normal text-slate-400">kWh</span>
              </p>
            </div>
            <div className="mt-auto rounded-lg bg-slate-100 py-3 text-center text-sm font-medium text-slate-400">
              Podrás enviar una nueva lectura al inicio del próximo mes
            </div>
          </div>
        </div>

        <HistorialChart history={history} />
      </div>
    )
  }

  /* ── Form ── */
  return (
    <div className="space-y-5">
      <form action={action} encType="multipart/form-data" onSubmit={handleSubmit}>
        <input type="hidden" name="periodo" value={periodo} />

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
              name="foto"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-1 min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
                preview
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
                  <p className="text-sm font-medium text-slate-600">Tomar foto del contador</p>
                  <p className="mt-1 text-xs text-slate-400 text-center">
                    Toque aquí para abrir la cámara o seleccionar imagen
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
                step="1"
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
