import { requireUser } from "@/lib/auth/session"
import { getPortalProfile } from "@/lib/data/portal"
import { PortalDashboard } from "./portal-dashboard"

export default async function PortalPage() {
  const user = await requireUser()

  const profile = await getPortalProfile(user.id)
  if (!profile) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        No se encontró un contrato activo asociado a este usuario. Contacte al
        administrador.
      </div>
    )
  }

  return <PortalDashboard profile={profile} />
}
