"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export function BackButton({ label = "Volver" }: { label?: string }) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  )
}
