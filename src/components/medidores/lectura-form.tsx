"use client"

import { useActionState, useRef, useState } from "react"
import { registrarLectura, type MedidorState } from "@/app/(app)/medidores/actions"
import type { UnitWithMeter } from "@/lib/data/medidores"
import { Camera, FolderOpen, X } from "lucide-react"

const initial: MedidorState = {}

const MES: Record<string, string> = {
  "01": "Enero", "02": "Febrero", "03": "Marzo", "04": "Abril",
  "05": "Mayo",  "06": "Junio",   "07": "Julio", "08": "Agosto",
  "09": "Septiembre", "10": "Octubre", "11": "Noviembre", "12": "Diciembre",
}

function lastThreeMonths(): Array<{ value: string; label: string }> {
  const result = []
  const now = new Date()
  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    result.push({ value: `${y}-${m}`, label: `${MES[m]} ${y}` })
  }
  return result
}

const MONTHS = lastThreeMonths()

function prevPeriodo(p: string): string {
  const [y, m] = p.split("-").map(Number)
  const d = new Date(y, m - 2)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export function LecturaForm({ units, periodo }: { units: UnitWithMeter[]; periodo: string }) {
  const [state, action, pending] = useActionState(registrarLectura, initial)
  const [selectedId, setSelectedId]         = useState("")
  const [selectedPeriodo, setSelectedPeriodo] = useState(
    // Default to the page's periodo (measurement month); fall back to the previous
    // calendar month — day-9 readings always belong to the month that just ended.
    MONTHS.find((m) => m.value === periodo)?.value ?? MONTHS[1]?.value ?? MONTHS[0].value
  )
  const fileInputRef                          = useRef<HTMLInputElement>(null)
  const cameraInputRef                        = useRef<HTMLInputElement>(null)
  const [preview, setPreview]                 = useState<string | null>(null)
  const [fotoBase64, setFotoBase64]           = useState<string | null>(null)
  const [fotoMime, setFotoMime]               = useState("image/jpeg")

  const selectedUnit    = units.find((u) => u.unitId === selectedId) ?? null
  const calPriorPeriodo = prevPeriodo(selectedPeriodo)

  // Use calendar-prior month if it has a reading; otherwise fall back to the most recent reading
  // before the selected period (e.g. April 2026 was skipped → fall back to March 2026).
  const lecturaAnteriorPeriodo = (() => {
    if (!selectedUnit) return calPriorPeriodo
    if (selectedUnit.readingsByPeriodo[calPriorPeriodo] != null) return calPriorPeriodo
    const earlier = Object.keys(selectedUnit.readingsByPeriodo)
      .filter((p) => p < selectedPeriodo)
      .sort()
      .reverse()
    return earlier[0] ?? calPriorPeriodo
  })()
  const lecturaAnterior = selectedUnit?.readingsByPeriodo[lecturaAnteriorPeriodo] ?? null
  const alreadyExists   = selectedUnit?.existingPeriodos.includes(selectedPeriodo) ?? false

  function applyFile(file: File) {
    setPreview(URL.createObjectURL(file))
    setFotoMime(file.type || "image/jpeg")
    const reader = new FileReader()
    reader.onload = (e) => setFotoBase64(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  function clearPhoto() {
    setPreview(null)
    setFotoBase64(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function selectUnit(id: string) {
    setSelectedId(id)
    clearPhoto()
  }

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Local</label>
          <select
            name="unitId"
            required
            value={selectedId}
            onChange={(e) => selectUnit(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar…</option>
            {units.map((u) => (
              <option key={u.unitId} value={u.unitId}>
                {u.unitNumber}{u.tenantName ? ` — ${u.tenantName}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Período</label>
          <select
            name="periodo"
            required
            value={selectedPeriodo}
            onChange={(e) => setSelectedPeriodo(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Locked state — reading already exists */}
      {alreadyExists && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Ya existe una lectura para este local en {MONTHS.find(m => m.value === selectedPeriodo)?.label}. No se puede modificar.
        </div>
      )}

      {!alreadyExists && (
        <>
          {/* Previous reading — auto-filled */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Lectura anterior
              {lecturaAnterior != null && (
                <span className="ml-1.5 font-normal text-slate-400">({lecturaAnteriorPeriodo})</span>
              )}
            </label>
            <input
              type="number"
              value={lecturaAnterior ?? ""}
              readOnly
              placeholder={selectedId ? "Sin lectura registrada" : "Selecciona un local primero"}
              className="w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
            />
            <input type="hidden" name="lecturaAnterior" value={lecturaAnterior ?? 0} />
            {selectedId && lecturaAnterior == null && (
              <p className="mt-1.5 text-xs text-amber-700">
                Primera lectura de este local. Se guarda como punto de partida — este mes no se cobra.
              </p>
            )}
          </div>

          {/* Current reading */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Lectura actual</label>
            <input
              type="number"
              name="lecturaActual"
              min={lecturaAnterior ?? 0}
              step="0.1"
              required
              placeholder="Ingresa la lectura del contador"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Photo upload */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Foto del contador <span className="font-normal text-slate-400">(opcional)</span>
            </label>

            {/* Camera — opens device camera directly */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) applyFile(f) }}
            />
            {/* Gallery / file picker */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) applyFile(f) }}
            />

            {fotoBase64 && <input type="hidden" name="fotoBase64" value={fotoBase64} />}
            {fotoBase64 && <input type="hidden" name="fotoMime"    value={fotoMime} />}
            {selectedUnit  && <input type="hidden" name="unitNumber" value={selectedUnit.unitNumber} />}

            {preview ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Vista previa" className="h-16 w-16 rounded-lg object-cover border border-slate-200" />
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700"
                >
                  <X className="h-3.5 w-3.5" /> Quitar foto
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-500 hover:border-slate-400 hover:bg-white transition-colors"
                >
                  <Camera className="h-4 w-4" />
                  Tomar foto
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-500 hover:border-slate-400 hover:bg-white transition-colors"
                >
                  <FolderOpen className="h-4 w-4" />
                  Adjuntar foto
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Notas (opcional)</label>
            <input
              type="text"
              name="notas"
              placeholder="Observaciones…"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={pending || !selectedId}
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {pending ? "Guardando…" : "Registrar lectura"}
          </button>
        </>
      )}
    </form>
  )
}
