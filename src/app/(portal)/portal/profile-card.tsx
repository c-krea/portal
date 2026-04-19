import Link from "next/link"
import { Building2, CalendarDays, ArrowRight, ChevronRight } from "lucide-react"
import { formatDate } from "@/lib/formatters"
import type { PortalProfile } from "@/lib/data/portal"

export function ProfileCard({ profile }: { profile: PortalProfile }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-4 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
          <Building2 className="h-5 w-5 text-slate-600" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-slate-900">
            {profile.nombreCorto ?? profile.razonSocial}
          </h1>
          <p className="mt-0.5 text-sm font-medium text-slate-500">
            Local {profile.unitNumber}
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span>Contrato:</span>
            <span className="font-medium text-slate-600">
              {formatDate(profile.fechaInicio)}
            </span>
            <ArrowRight className="h-3 w-3" />
            <span className="font-medium text-slate-600">
              {profile.fechaFin ? formatDate(profile.fechaFin) : "Vigente"}
            </span>
          </div>
        </div>
        <Link
          href="/portal/perfil"
          className="shrink-0 flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 mt-1"
        >
          Ver perfil
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
