"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { isValidPeriodo } from "@/lib/security/validators"

const MES_NOMBRE: Record<string, string> = {
  "01": "Enero",    "02": "Febrero",   "03": "Marzo",
  "04": "Abril",    "05": "Mayo",      "06": "Junio",
  "07": "Julio",    "08": "Agosto",    "09": "Septiembre",
  "10": "Octubre",  "11": "Noviembre", "12": "Diciembre",
}

function formatPeriodo(p: string): string {
  const [y, m] = p.split("-")
  const nombre = MES_NOMBRE[m]
  return nombre ? `${nombre} ${y}` : p
}

type Props = {
  periodos: { value: string; label: string }[]
  periodo: string
  basePath: string
}

export function PeriodoDropdown({ periodos, periodo, basePath }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  // siesa_raw stores the ERP year-end closing as month 13 (e.g. 202513 →
  // "2025-13"). page.tsx (isValidPeriodo) and every gastos.ts query
  // (assertPeriodo) accept calendar months 01-12 only, so a "13" row can never
  // resolve — listing it would recreate the dead-option bug this replaces
  // (WOR-311: picking year 2025 always snapped back to the newest period).
  const options = periodos.filter((p) => isValidPeriodo(p.value))

  // Same mechanics as the scrollable filter panel in pagos-table.tsx:
  // outside-click (pointerdown on the container ref) + Escape close.
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open ])

  function pick(value: string) {
    setOpen(false)
    router.push(`${basePath}?periodo=${value}`)
  }

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 min-w-[120px] items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 hover:border-slate-300"
      >
        {formatPeriodo(periodo)}
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 max-h-64 w-52 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
          {options.length === 0 ? (
            <p className="px-2 py-1.5 text-sm text-slate-400">Sin periodos</p>
          ) : (
            options.map((p) => (
              <button
                key={p.value}
                onClick={() => pick(p.value)}
                className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-slate-100 ${
                  p.value === periodo
                    ? "bg-slate-100 font-semibold text-slate-900"
                    : "text-slate-700"
                }`}
              >
                {formatPeriodo(p.value)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
