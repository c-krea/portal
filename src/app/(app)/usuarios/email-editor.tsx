"use client"

import { useState, useTransition } from "react"
import { Pencil, Check, X, Loader2 } from "lucide-react"
import { updatePortalEmail } from "./actions"

export function EmailEditor({
  tenantId,
  initialEmail,
}: {
  tenantId: string
  initialEmail: string | null
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initialEmail ?? "")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const result = await updatePortalEmail(tenantId, value)
      if ("error" in result) {
        setError(result.error)
      } else {
        setEditing(false)
      }
    })
  }

  function handleCancel() {
    setValue(initialEmail ?? "")
    setEditing(false)
    setError(null)
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <input
            type="email"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave()
              if (e.key === "Escape") handleCancel()
            }}
            autoFocus
            className="w-56 rounded border border-blue-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={handleSave}
            disabled={pending}
            className="rounded p-1 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={handleCancel}
            disabled={pending}
            className="rounded p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="group flex items-center gap-1.5 text-left text-sm"
    >
      {initialEmail ? (
        <span className="text-slate-700">{initialEmail}</span>
      ) : (
        <span className="italic text-slate-400">Sin email — clic para agregar</span>
      )}
      <Pencil className="h-3.5 w-3.5 shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  )
}
