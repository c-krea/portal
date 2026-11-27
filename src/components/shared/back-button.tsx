"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

const CLS = "flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"

/**
 * With `href`, always goes to that page (e.g. "Locales" → /locales, no matter
 * where the user came from, such as the Resumen). Without it, browser back.
 */
export function BackButton({ label = "Volver", href }: { label?: string; href?: string }) {
  const router = useRouter()
  if (href) {
    return (
      <Link href={href} className={CLS}>
        <ArrowLeft className="h-4 w-4" />
        {label}
      </Link>
    )
  }
  return (
    <button onClick={() => router.back()} className={CLS}>
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  )
}
