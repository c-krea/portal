"use client"

import { useActionState, useRef } from "react"
import { updateFinancialRule, type UpdateRuleState } from "@/app/(app)/configuracion/actions"

type Props = {
  id: string
  ruleKey: string
  currentValue: number
  unit: string
  hint: string
}

const initialState: UpdateRuleState = { success: false }

export function RuleForm({ id, ruleKey, currentValue, unit, hint }: Props) {
  const [state, action, pending] = useActionState(updateFinancialRule, initialState)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input
        ref={inputRef}
        name="value"
        type="number"
        step="any"
        defaultValue={currentValue}
        className="w-32 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-mono text-slate-900 focus:border-slate-400 focus:outline-none"
        aria-label={`Valor ${ruleKey}`}
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
      {hint && (
        <span className="text-xs text-slate-400 hidden lg:inline">{hint}</span>
      )}
    </form>
  )
}
