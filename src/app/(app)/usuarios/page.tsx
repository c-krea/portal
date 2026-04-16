export const dynamic = "force-dynamic"

import { PageHeader } from "@/components/layout/page-header"
import { getUsuarios } from "@/lib/data/usuarios"
import { cn } from "@/lib/utils"
import { UserPlus, Shield, Eye, DollarSign, User } from "lucide-react"

const ROLE_CONFIG: Record<
  string,
  { label: string; cls: string; icon: React.ReactNode }
> = {
  admin: {
    label: "Admin",
    cls: "bg-violet-100 text-violet-800",
    icon: <Shield className="h-3 w-3" />,
  },
  finance: {
    label: "Finanzas",
    cls: "bg-blue-100 text-blue-800",
    icon: <DollarSign className="h-3 w-3" />,
  },
  viewer: {
    label: "Consulta",
    cls: "bg-slate-100 text-slate-700",
    icon: <Eye className="h-3 w-3" />,
  },
  tenant: {
    label: "Inquilino",
    cls: "bg-amber-100 text-amber-800",
    icon: <User className="h-3 w-3" />,
  },
}

export default async function UsuariosPage() {
  const usuarios = await getUsuarios()

  const activeCount = usuarios.filter((u) => u.isActive).length
  const byRole = Object.keys(ROLE_CONFIG).reduce<Record<string, number>>(
    (acc, r) => ({ ...acc, [r]: usuarios.filter((u) => u.role === r).length }),
    {},
  )

  return (
    <>
      <PageHeader title="Usuarios" />

      {/* Stats + action row */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm">
            <span className="text-slate-500">Total: </span>
            <span className="font-semibold text-slate-900">{usuarios.length}</span>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm">
            <span className="text-slate-500">Activos: </span>
            <span className="font-semibold text-emerald-700">{activeCount}</span>
          </div>
          {Object.entries(byRole).map(([role, count]) =>
            count > 0 ? (
              <div
                key={role}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm"
              >
                {ROLE_CONFIG[role]?.icon}
                <span className="text-slate-500">{ROLE_CONFIG[role]?.label}:</span>
                <span className="font-semibold text-slate-800">{count}</span>
              </div>
            ) : null,
          )}
        </div>

        {/* Invite button — placeholder (auth not wired yet) */}
        <button
          disabled
          title="Disponible cuando se configure autenticación"
          className="flex cursor-not-allowed items-center gap-2 rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-400"
        >
          <UserPlus className="h-4 w-4" />
          Invitar Usuario
        </button>
      </div>

      {/* Users table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {usuarios.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <UserPlus className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">No hay usuarios registrados</p>
            <p className="mt-1 text-xs text-slate-400">
              Los usuarios se crean al registrarse con Supabase Auth.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Nombre
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Email
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Rol
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Inquilino vinculado
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Estado
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Creado
                  </th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => {
                  const roleCfg = ROLE_CONFIG[u.role] ?? {
                    label: u.role,
                    cls: "bg-slate-100 text-slate-600",
                    icon: null,
                  }
                  return (
                    <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-900">{u.fullName}</td>
                      <td className="px-5 py-3 text-slate-500">{u.email}</td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                            roleCfg.cls,
                          )}
                        >
                          {roleCfg.icon}
                          {roleCfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {u.tenantName ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs font-medium",
                            u.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-400",
                          )}
                        >
                          {u.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString("es-CO", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Auth note */}
      <p className="mt-4 text-xs text-slate-400">
        La gestión de usuarios requiere integración con Supabase Auth (Fase 2).
        Los perfiles se crean automáticamente al registrarse.
      </p>
    </>
  )
}
