"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { submitLectura, type MedidorPortalState } from "./actions"
import { Camera, X, CheckCircle2 } from "lucide-react"
import type { PortalMedidorHistoryRow } from "@/lib/data/portal"
import { HistorialChart } from "./chart"

const initial: MedidorPortalState = {}

function periodoLabel(periodo: string) {
  const [year, month] = periodo.split("-")
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString("es-CO", { month: "short", year: "numeric" })
}

function MeterDigitInput({
  digits,
  onChange,
}: {
  digits: string[]
  onChange: (digits: string[]) => void
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[i] !== "") {
        const next = [...digits]; next[i] = ""; onChange(next)
      } else if (i > 0) refs.current[i - 1]?.focus()
    } else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus()
    else if (e.key === "ArrowRight" && i < 4) refs.current[i + 1]?.focus()
  }

  function handleInput(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, "").slice(-1)
    const next = [...digits]; next[i] = val; onChange(next)
    if (val && i < 4) refs.current[i + 1]?.focus()
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 5)
    const next = [...digits]
    for (let j = 0; j < 5; j++) next[j] = pasted[j] ?? ""
    onChange(next)
    refs.current[Math.min(pasted.length, 4)]?.focus()
  }

  return (
    <div className="flex items-center gap-2">
      {digits.map((d, i) => (
        <input key={i} ref={(el) => { refs.current[i] = el }}
          type="text" inputMode="numeric" maxLength={1} value={d}
          onChange={(e) => handleInput(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className="h-14 w-11 rounded-lg border-2 border-slate-300 bg-white text-center text-2xl font-bold tabular-nums text-slate-900 focus:border-blue-500 focus:outline-none" />
      ))}
      <div className="relative h-14 w-11 rounded-lg border-2 border-red-300 bg-red-50 flex items-center justify-center overflow-hidden">
        <span className="text-2xl font-bold tabular-nums text-red-300">?</span>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 44 56" preserveAspectRatio="none">
          <line x1="0" y1="0" x2="44" y2="56" stroke="#fca5a5" strokeWidth="2" />
          <line x1="44" y1="0" x2="0" y2="56" stroke="#fca5a5" strokeWidth="2" />
        </svg>
      </div>
    </div>
  )
}

export type UnitMedidorData = {
  unitId: string
  unitNumber: string
  lecturaAnteriorRef: number
  tarifaKwh: number
  alreadySubmitted: boolean
  history: PortalMedidorHistoryRow[]
}

export function MedidorForm({
  periodo,
  units,
  chartSeries,
}: {
  periodo: string
  units: UnitMedidorData[]
  chartSeries: { label: string; data: PortalMedidorHistoryRow[] }[]
}) {
  const router = useRouter()
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [state, action, pending] = useActionState(submitLectura, initial)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [digits, setDigits] = useState(["", "", "", "", ""])
  const [preview, setPreview] = useState<string | null>(null)
  const [fotoBase64, setFotoBase64] = useState<string | null>(null)
  const [fotoMime, setFotoMime] = useState<string>("image/jpeg")
  const [dragging, setDragging] = useState(false)

  const selected = units[selectedIdx]

  // Reset form when switching units
  function selectUnit(idx: number) {
    setSelectedIdx(idx)
    setDigits(["", "", "", "", ""])
    setPreview(null); setFotoBase64(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  useEffect(() => {
    if (state.success) { router.refresh(); setDigits(["", "", "", "", ""]); setPreview(null); setFotoBase64(null) }
  }, [state.success, router])

  function applyFile(file: File) {
    setPreview(URL.createObjectURL(file))
    setFotoMime(file.type || "image/jpeg")
    const reader = new FileReader()
    reader.onload = (e) => setFotoBase64(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-5">

      {/* Unit tab selector — only for multi-unit tenants */}
      {units.length > 1 && (
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
          {units.map((u, idx) => (
            <button key={u.unitId} type="button" onClick={() => selectUnit(idx)}
              className={`relative flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
                selectedIdx === idx
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}>
              Local {u.unitNumber}
              {u.alreadySubmitted && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500">
                  <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Already submitted state */}
      {selected.alreadySubmitted ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500 mb-3" />
          <p className="font-semibold text-emerald-800">
            Lectura de Local {selected.unitNumber} ya enviada para {periodoLabel(periodo)}
          </p>
          <p className="mt-1 text-sm text-emerald-600">
            Comuníquese con la administración si necesita corregirla.
          </p>
        </div>
      ) : (
        <form action={action}>
          <input type="hidden" name="periodo" value={periodo} />
          <input type="hidden" name="localId" value={selected.unitId} />
          {fotoBase64 && <input type="hidden" name="fotoBase64" value={fotoBase64} />}
          {fotoBase64 && <input type="hidden" name="fotoMime" value={fotoMime} />}

          {state.error && (
            <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</div>
          )}
          {state.success && state.message && (
            <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.message}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Left: photo */}
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-slate-700">Foto del contador</p>
              <input ref={fileInputRef} type="file" accept="image/*,application/pdf"
                className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) applyFile(f) }} />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) applyFile(f) }}
                className={`relative flex flex-1 min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
                  dragging ? "border-blue-400 bg-blue-50"
                  : preview ? "border-transparent p-0 overflow-hidden"
                  : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white p-6"
                }`}>
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
                    <p className="mt-1 text-xs text-slate-400 text-center">Arrastra aquí o toque para seleccionar · JPG, PNG, PDF</p>
                  </>
                )}
              </div>
              {preview && (
                <button type="button" onClick={() => { setPreview(null); setFotoBase64(null); if (fileInputRef.current) fileInputRef.current.value = "" }}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700">
                  <X className="h-3.5 w-3.5" /> Quitar foto
                </button>
              )}
              <p className="text-xs text-slate-400">Opcional. Enviar foto acelera la aprobación automática.</p>
            </div>

            {/* Right: digit input */}
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Lectura anterior:{" "}
                <span className="font-semibold text-slate-900">
                  {String(Math.floor(selected.lecturaAnteriorRef)).padStart(5, "0")} kWh
                </span>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Lectura actual (kWh) <span className="text-rose-500">*</span>
                </label>
                <input type="hidden" name="lecturaActual" value={digits.join("")} />
                <MeterDigitInput digits={digits} onChange={setDigits} />
                <p className="mt-1.5 text-xs text-slate-400">
                  Ingresa los 5 dígitos negros del contador. El dígito rojo (decimal) no se registra.
                </p>
              </div>

              {digits.some(d => d !== "") && (() => {
                const lecturaActual = Number(digits.join("") || "0")
                const consumo = Math.max(0, lecturaActual - Math.floor(selected.lecturaAnteriorRef))
                const total = consumo * selected.tarifaKwh
                const allFilled = digits.every(d => d !== "")
                return (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 divide-y divide-slate-200 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-slate-500">Lectura anterior</span>
                      <span className="font-semibold tabular-nums text-slate-700">{String(Math.floor(selected.lecturaAnteriorRef)).padStart(5, "0")} kWh</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-slate-500">Lectura este mes</span>
                      <span className="font-semibold tabular-nums text-slate-700">{digits.join("").padStart(5, "0")} kWh</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-slate-500">Diferencia</span>
                      <span className="font-semibold tabular-nums text-slate-900">{consumo.toLocaleString("es-CO")} kWh</span>
                    </div>
                    {allFilled && selected.tarifaKwh > 0 && (
                      <div className="flex items-center justify-between px-4 py-3 bg-emerald-50">
                        <span className="text-sm font-medium text-emerald-700">Total estimado energía</span>
                        <span className="font-bold tabular-nums text-emerald-800">$ {Math.round(total).toLocaleString("es-CO")}</span>
                      </div>
                    )}
                  </div>
                )
              })()}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Notas (opcional)</label>
                <input type="text" name="notas" placeholder="Ej: Contador reemplazado, lectura inusual…"
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <button type="submit" disabled={pending}
                className="mt-auto w-full rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 transition-colors">
                {pending ? "Enviando…" : `Enviar lectura Local ${selected.unitNumber}`}
              </button>
            </div>
          </div>
        </form>
      )}

      <HistorialChart series={chartSeries} />
    </div>
  )
}
