import { Building2 } from "lucide-react"
import type { PortalProfile } from "@/lib/data/portal"

export function ProfileCard({ profile }: { profile: PortalProfile }) {
  const unitsLabel = profile.allUnits.length > 1
    ? `Locales ${profile.allUnits.join(" · ")}`
    : `Local ${profile.allUnits[0]}`

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 p-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
          <Building2 className="h-4 w-4 text-slate-600" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold text-slate-900">
            {profile.nombreCorto ?? profile.razonSocial}
          </h1>
          <p className="text-xs text-slate-500">{unitsLabel}</p>
        </div>
      </div>
    </div>
  )
}
