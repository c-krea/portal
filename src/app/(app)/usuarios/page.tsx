export const dynamic = "force-dynamic"

import { PageHeader } from "@/components/layout/page-header"
import { getPortalTenants } from "@/lib/data/usuarios"
import { EmailEditor } from "./email-editor"
import { CheckCircle2, CircleDashed, Mail, UserCheck } from "lucide-react"

function lastSignInLabel(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  const diffMs = Date.now() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return "Hoy"
  if (diffDays === 1) return "Ayer"
  if (diffDays < 30) return `Hace ${diffDays} días`
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })
}

export default async function UsuariosPage() {
  const tenants = await getPortalTenants()

  const withEmail  = tenants.filter(t => t.portalEmail).length
  const withAccount = tenants.filter(t => t.authUserId).length
  const recentActive = tenants.filter(t => {
    if (!t.lastSignIn) return false
    return Date.now() - new Date(t.lastSignIn).getTime() < 30 * 24 * 60 * 60 * 1000
  }).length

  return (
    <>
      <PageHeader title="Usuarios del Portal" />

      {/* Stats */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm">
          <span className="text-slate-500">Inquilinos activos: </span>
          <span className="font-semibold text-slate-900">{tenants.length}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm">
          <Mail className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-slate-500">Email configurado: </span>
          <span className="font-semibold text-blue-700">{withEmail}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm">
          <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-slate-500">Cuenta creada: </span>
          <span className="font-semibold text-emerald-700">{withAccount}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-slate-500">Activos (30 días): </span>
          <span className="font-semibold text-emerald-700">{recentActive}</span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Local
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Inquilino
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Email Portal (login)
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Estado
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Último Acceso
                </th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => {
                const hasAccount = !!t.authUserId
                const hasEmail   = !!t.portalEmail

                return (
                  <tr key={t.tenantId} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono text-xs font-medium text-slate-600">
                      {t.units}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {t.nombre}
                    </td>
                    <td className="px-5 py-3">
                      <EmailEditor tenantId={t.tenantId} initialEmail={t.portalEmail} />
                    </td>
                    <td className="px-5 py-3">
                      {hasAccount ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />
                          Cuenta activa
                        </span>
                      ) : hasEmail ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                          <Mail className="h-3 w-3" />
                          Email listo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                          <CircleDashed className="h-3 w-3" />
                          Sin configurar
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">
                      {lastSignInLabel(t.lastSignIn)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Haga clic en el email de cualquier fila para editarlo. El email se usa para crear la cuenta del portal del inquilino.
      </p>
    </>
  )
}
