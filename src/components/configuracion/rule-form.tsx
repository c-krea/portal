"use client"

import { useActionState, useRef, useState } from "react"
import { updateFinancialRule, type UpdateRuleState } from "@/app/(app)/configuracion/actions"
import { formatCOP } from "@/lib/formatters"

type Props = {
  id: string
  ruleKey: string
  label: string
  currentValue: number
  unit: string
  displayPercent?: boolean
}

const initialState: UpdateRuleState = { success: false }

// Ejemplo fijo en pesos para que el tamaño del cambio sea concreto.
// Los totales antes/después se CALCULAN con las tasas real y propuesta.
const EJEMPLO_CANON = 1_000_000

export function RuleForm({ id, ruleKey, label, currentValue, unit, displayPercent }: Props) {
  // IVA is stored as a decimal fraction (0.19) but reads/writes as a
  // percentage (19). Divide back before saving so the STORED value keeps its
  // meaning — the display value is rounded so float dust (e.g. 0.29 * 100)
  // can never reach the stored value.
  const [state, action, pending] = useActionState(
    async (_prev: UpdateRuleState, formData: FormData): Promise<UpdateRuleState> => {
      if (displayPercent) {
        formData.set("value", String(Number(formData.get("value")) / 100))
      }
      return updateFinancialRule(_prev, formData)
    },
    initialState,
  )
  const inputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  // One-time bypass so the submit triggered by the confirm button is the
  // real save, not another interception that reopens the dialog.
  const allowSaveRef = useRef(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingPercent, setPendingPercent] = useState(0)
  const [ackCambio, setAckCambio] = useState(false)
  const [ackAlcance, setAckAlcance] = useState(false)
  const [ackEjemplo, setAckEjemplo] = useState(false)

  // Only IVA gets the confirmation flow. The other knobs save as before.
  const isIva = ruleKey === "iva_rate"
  const originalPercent = displayPercent ? Number((currentValue * 100).toFixed(4)) : currentValue

  const handleSubmit = (e: React.FormEvent) => {
    if (!isIva || allowSaveRef.current) {
      allowSaveRef.current = false
      return
    }
    const raw = Number(inputRef.current?.value)
    // Let the server return "Valor inválido" for non-numeric input, and skip
    // the dialog when nothing actually changed.
    if (!Number.isFinite(raw) || raw === originalPercent) return
    e.preventDefault()
    setPendingPercent(raw)
    setAckCambio(false)
    setAckAlcance(false)
    setAckEjemplo(false)
    setConfirmOpen(true)
  }

  const handleCancel = () => {
    setConfirmOpen(false)
    setAckCambio(false)
    setAckAlcance(false)
    setAckEjemplo(false)
    // Cancel leaves the stored value untouched and puts the input back.
    if (inputRef.current) inputRef.current.value = String(originalPercent)
  }

  const handleConfirm = () => {
    setConfirmOpen(false)
    allowSaveRef.current = true
    formRef.current?.requestSubmit()
  }

  // Computed worked example — never hardcoded.
  const currentFraction = currentValue
  const newFraction = pendingPercent / 100
  const totalAntes = EJEMPLO_CANON * (1 + currentFraction)
  const totalDespues = EJEMPLO_CANON * (1 + newFraction)
  const allChecked = ackCambio && ackAlcance && ackEjemplo

  return (
    <>
      <form ref={formRef} action={action} onSubmit={handleSubmit} className="flex items-center gap-2">
        <input type="hidden" name="id" value={id} />
        <input
          ref={inputRef}
          name="value"
          type="number"
          step="any"
          defaultValue={originalPercent}
          className="w-32 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-mono text-slate-900 focus:border-slate-400 focus:outline-none"
          aria-label={label}
        />
        <span className="text-xs text-slate-400">{unit}</span>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {pending ? "..." : "Guardar"}
        </button>
        {state.success && (
          <span className="text-xs text-emerald-600">✓ Guardado</span>
        )}
        {state.error && (
          <span className="text-xs text-rose-600">{state.error}</span>
        )}
      </form>

      {isIva && confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true" aria-label="Confirmar cambio de IVA">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg">
            <h3 className="text-sm font-semibold text-slate-900">Confirmar cambio de IVA</h3>
            <div className="mt-2 space-y-2 text-sm text-slate-600">
              <p>
                Va a cambiar el IVA de <strong>{originalPercent} %</strong> a <strong>{pendingPercent} %</strong>.
              </p>
              <p>
                Este cambio aplica a todas las facturas futuras: la facturación, las proyecciones y lo que
                ven los inquilinos en el portal.
              </p>
              <p>
                Ejemplo con un canon de {formatCOP(EJEMPLO_CANON)}: hoy la factura queda en{" "}
                <strong>{formatCOP(totalAntes)}</strong>, con el nuevo IVA quedaría en{" "}
                <strong>{formatCOP(totalDespues)}</strong>.
              </p>
            </div>
            <div className="mt-4 space-y-2">
              <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={ackCambio}
                  onChange={(e) => setAckCambio(e.target.checked)}
                  className="mt-1"
                />
                Entiendo que el IVA pasa de {originalPercent} % a {pendingPercent} %.
              </label>
              <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={ackAlcance}
                  onChange={(e) => setAckAlcance(e.target.checked)}
                  className="mt-1"
                />
                Entiendo que afecta todas las facturas futuras: facturación, proyecciones y portal del inquilino.
              </label>
              <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={ackEjemplo}
                  onChange={(e) => setAckEjemplo(e.target.checked)}
                  className="mt-1"
                />
                Vi el ejemplo: {formatCOP(EJEMPLO_CANON)} pasa de {formatCOP(totalAntes)} a {formatCOP(totalDespues)}.
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!allChecked}
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                Confirmar y guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
