"use client"

import { useState, useTransition } from "react"
import { Building2, ShieldCheck, CheckCircle2, CircleDashed, Mail, UserCheck, UserPlus, Loader2, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { EditAdminModal } from "./edit-admin-modal"
import { EditTenantModal } from "./edit-tenant-modal"
import { createTenantAccount } from "./actions"
import type { PortalTenantRow, UsuarioRow } from "@/lib/data/usuarios"

function CreateAccountButton({ tenantId }: { tenantId: string }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)
    start(async () => {
      const res = await createTenantAccount(tenantId)
      if ("error" in res) setError(res.error)
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" />}
        {pending ? "Creando…" : "Crear cuenta"}
      </button>
      {error && <p className="text-xs text-rose-600 max-w-[160px] text-right">{error}</p>}
    </div>
  )
}

function lastSignInLabel(iso: string | null): string {
  if (!iso) return "Nunca"
  const d = new Date(iso)
  return d.toLocaleString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  })
}

const ROLE_LABELS: Record<string, { label: string; cls: string }> = {
  admin:    { label: "Admin",    cls: "bg-violet-100 text-violet-800" },
  finanzas: { label: "Finanzas", cls: "bg-blue-100 text-blue-800" },
  visor:    { label: "Consulta", cls: "bg-slate-100 text-slate-700" },
}

// Windowed page numbers: 1 … (c-1) c (c+1) … N with a 2-page edge.
// Copied from src/components/pagos/pagos-table.tsx.
function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = [...new Set(
    [1, 2, current - 1, current, current + 1, total - 1, total].filter((n) => n >= 1 && n <= total),
  )].sort((a, b) => a - b)
  const out: (number | "…")[] = []
  pages.forEach((n, i) => {
    if (i > 0 && n - pages[i - 1] > 1) out.push("…")
    out.push(n)
  })
  return out
}

export function TabSwitcher({
  tenants,
  admins,
}: {
  tenants: PortalTenantRow[]
  admins: UsuarioRow[]
}) {
  const [tab, setTab] = useState<"inquilinos" | "admins">("inquilinos")

  // Independent page state per tab, same pattern as pagos-table.tsx: any
  // page-size or row-count change drops back to page 1.
  const [pageInq, setPageInq] = useState(1)
  const [pageSizeInq, setPageSizeInq] = useState(25)
  const inqFilterKey = `${pageSizeInq}|${tenants.length}`
  const [lastInqFilterKey, setLastInqFilterKey] = useState(inqFilterKey)
  if (lastInqFilterKey !== inqFilterKey) {
    setLastInqFilterKey(inqFilterKey)
    setPageInq(1)
  }
  const totalPagesInq = Math.max(1, Math.ceil(tenants.length / pageSizeInq))
  const safePageInq = Math.min(pageInq, totalPagesInq)
  const paginatedInq = tenants.slice((safePageInq - 1) * pageSizeInq, safePageInq * pageSizeInq)
  const rangeAInq = tenants.length === 0 ? 0 : (safePageInq - 1) * pageSizeInq + 1
  const rangeBInq = Math.min(safePageInq * pageSizeInq, tenants.length)

  const [pageAdm, setPageAdm] = useState(1)
  const [pageSizeAdm, setPageSizeAdm] = useState(25)
  const admFilterKey = `${pageSizeAdm}|${admins.length}`
  const [lastAdmFilterKey, setLastAdmFilterKey] = useState(admFilterKey)
  if (lastAdmFilterKey !== admFilterKey) {
    setLastAdmFilterKey(admFilterKey)
    setPageAdm(1)
  }
  const totalPagesAdm = Math.max(1, Math.ceil(admins.length / pageSizeAdm))
  const safePageAdm = Math.min(pageAdm, totalPagesAdm)
  const paginatedAdm = admins.slice((safePageAdm - 1) * pageSizeAdm, safePageAdm * pageSizeAdm)
  const rangeAAdm = admins.length === 0 ? 0 : (safePageAdm - 1) * pageSizeAdm + 1
  const rangeBAdm = Math.min(safePageAdm * pageSizeAdm, admins.length)

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-5 flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
        <button
          onClick={() => setTab("inquilinos")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
            tab === "inquilinos"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Building2 className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Inquilinos del Portal</span>
          <span className="sm:hidden">Inquilinos</span>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
            {tenants.length}
          </span>
        </button>
        <button
          onClick={() => setTab("admins")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
            tab === "admins"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <ShieldCheck className="h-4 w-4 shrink-0" />
          Administración
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
            {admins.length}
          </span>
        </button>
      </div>

      {/* Inquilinos table */}
      {tab === "inquilinos" && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Local</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Inquilino</th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Email Portal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Estado</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Último Acceso</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {paginatedInq.map((t) => {
                  const hasAccount = !!t.authUserId
                  const hasEmail   = !!t.portalEmail
                  const hasSignedIn = !!t.lastSignIn
                  return (
                    <tr key={t.tenantId} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-slate-600">{t.units}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{t.nombre}</td>
                      <td className="hidden sm:table-cell px-4 py-3 text-xs text-slate-600">
                        {t.portalEmail ?? <span className="italic text-slate-400">Sin email</span>}
                      </td>
                      <td className="px-4 py-3">
                        {hasAccount && hasSignedIn ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" /><span className="hidden sm:inline">Activo</span><span className="sm:hidden">✓</span>
                          </span>
                        ) : hasAccount && !hasSignedIn ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                            <Clock className="h-3 w-3" /><span className="hidden sm:inline">Invitado</span><span className="sm:hidden">~</span>
                          </span>
                        ) : hasEmail ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                            <Mail className="h-3 w-3" /><span className="hidden sm:inline">Email listo</span><span className="sm:hidden">@</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                            <CircleDashed className="h-3 w-3" /><span className="hidden sm:inline">Sin configurar</span><span className="sm:hidden">—</span>
                          </span>
                        )}
                      </td>
                      <td className="hidden md:table-cell px-4 py-3 text-xs text-slate-400">{lastSignInLabel(t.lastSignIn)}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          {hasEmail && !hasAccount && (
                            <CreateAccountButton tenantId={t.tenantId} />
                          )}
                          <EditTenantModal tenant={t} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
            <p className="text-xs text-slate-400">
              Mostrando {rangeAInq}–{rangeBInq} de {tenants.length}
            </p>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-slate-400">
                Filas
                <select
                  value={pageSizeInq}
                  onChange={(e) => setPageSizeInq(Number(e.target.value))}
                  className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-700 focus:border-slate-400 focus:outline-none"
                >
                  {[25, 50, 100].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
              {totalPagesInq > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPageInq(Math.max(1, safePageInq - 1))}
                    disabled={safePageInq === 1}
                    aria-label="Página anterior"
                    className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40"
                  >
                    ‹
                  </button>
                  {pageWindow(safePageInq, totalPagesInq).map((n, i) =>
                    n === "…" ? (
                      <span key={`gap-${i}`} className="px-1 text-xs text-slate-400">…</span>
                    ) : (
                      <button
                        key={n}
                        onClick={() => setPageInq(n)}
                        className={cn(
                          "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                          n === safePageInq
                            ? "bg-slate-900 text-white"
                            : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50",
                        )}
                      >
                        {n}
                      </button>
                    ),
                  )}
                  <button
                    onClick={() => setPageInq(Math.min(totalPagesInq, safePageInq + 1))}
                    disabled={safePageInq === totalPagesInq}
                    aria-label="Página siguiente"
                    className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admins table */}
      {tab === "admins" && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Nombre</th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Rol</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Último Acceso</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {paginatedAdm.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">
                      Sin usuarios administrativos registrados
                    </td>
                  </tr>
                ) : (
                  paginatedAdm.map((u) => {
                    const roleCfg = ROLE_LABELS[u.role] ?? { label: u.role, cls: "bg-slate-100 text-slate-600" }
                    return (
                      <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{u.fullName}</td>
                        <td className="hidden sm:table-cell px-4 py-3 text-xs text-slate-500">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${roleCfg.cls}`}>
                            <UserCheck className="h-3 w-3" />
                            {roleCfg.label}
                          </span>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 text-xs font-medium text-slate-700">
                          {lastSignInLabel(u.lastSignIn)}
                        </td>
                        <td className="px-3 py-3">
                          <EditAdminModal user={u} />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
            <p className="text-xs text-slate-400">
              Mostrando {rangeAAdm}–{rangeBAdm} de {admins.length}
            </p>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-slate-400">
                Filas
                <select
                  value={pageSizeAdm}
                  onChange={(e) => setPageSizeAdm(Number(e.target.value))}
                  className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-700 focus:border-slate-400 focus:outline-none"
                >
                  {[25, 50, 100].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
              {totalPagesAdm > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPageAdm(Math.max(1, safePageAdm - 1))}
                    disabled={safePageAdm === 1}
                    aria-label="Página anterior"
                    className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40"
                  >
                    ‹
                  </button>
                  {pageWindow(safePageAdm, totalPagesAdm).map((n, i) =>
                    n === "…" ? (
                      <span key={`gap-${i}`} className="px-1 text-xs text-slate-400">…</span>
                    ) : (
                      <button
                        key={n}
                        onClick={() => setPageAdm(n)}
                        className={cn(
                          "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                          n === safePageAdm
                            ? "bg-slate-900 text-white"
                            : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50",
                        )}
                      >
                        {n}
                      </button>
                    ),
                  )}
                  <button
                    onClick={() => setPageAdm(Math.min(totalPagesAdm, safePageAdm + 1))}
                    disabled={safePageAdm === totalPagesAdm}
                    aria-label="Página siguiente"
                    className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
