import { PageHeader } from "@/components/layout/page-header"
import { GenerateProyeccionesForm } from "@/components/proyecciones/generate-form"
import { getProyeccionSummaries, getContractsForProjection } from "@/lib/data/proyecciones"
import { getFinancialRules } from "@/lib/data/configuracion"
import { formatCOP } from "@/lib/formatters"
import { db } from "@/lib/db/client"
import { sql } from "drizzle-orm"

export default async function ProyeccionesPage() {
  const companies = await db.execute(sql`SELECT id FROM companies LIMIT 1`)
  const companyId = String((companies as Array<Record<string, unknown>>)[0].id)

  const currentYear = new Date().getFullYear()
  const nextYear = currentYear + 1

  const [summaries, rules, pendingContracts] = await Promise.all([
    getProyeccionSummaries(companyId),
    getFinancialRules(companyId),
    getContractsForProjection(companyId, nextYear),
  ])

  const ipcRule = rules.find((r) => r.ruleKey === "ipc_increment_pct")
  const defaultIpc = ipcRule ? ipcRule.ruleValue : 5.1

  return (
    <>
      <PageHeader title="Proyecciones de Canon" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left — form */}
        <div className="lg:col-span-1">
          <GenerateProyeccionesForm defaultYear={nextYear} defaultIpc={defaultIpc} />

          {/* Pending contracts note */}
          {pendingContracts.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-medium text-amber-800">
                {pendingContracts.length} contrato{pendingContracts.length !== 1 ? "s" : ""} sin proyección {nextYear}
              </p>
              <p className="mt-0.5 text-xs text-amber-600">
                Usa el formulario para generarlas con IPC.
              </p>
            </div>
          )}
          {pendingContracts.length === 0 && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-medium text-emerald-800">
                Todos los contratos tienen proyección {nextYear}.
              </p>
            </div>
          )}
        </div>

        {/* Right — coverage table */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-800">Cobertura por año</h2>
            </div>
            {summaries.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-slate-400">Sin proyecciones registradas</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Año</th>
                    <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Contratos</th>
                    <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Locales</th>
                    <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Canon mensual prom.</th>
                    <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {summaries.map((s) => (
                    <tr key={s.year} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-5 py-3 font-semibold text-slate-900">{s.year}</td>
                      <td className="px-5 py-3 text-right text-slate-700">{s.contractCount}</td>
                      <td className="px-5 py-3 text-right text-slate-700">{s.unitCount}</td>
                      <td className="px-5 py-3 text-right font-mono text-slate-900">{formatCOP(s.totalCanon)}</td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className={
                            s.year === currentYear
                              ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                              : s.year > currentYear
                              ? "rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                              : "rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500"
                          }
                        >
                          {s.year === currentYear ? "Activo" : s.year > currentYear ? "Futuro" : "Pasado"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pending contracts breakdown */}
          {pendingContracts.length > 0 && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-sm font-semibold text-slate-800">
                  Contratos pendientes {nextYear} ({pendingContracts.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Local</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Cliente</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Canon base ({nextYear - 1})</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Canon nuevo ({nextYear})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingContracts.map((c) => {
                      const newCanon = Math.round(c.lastCanon * (1 + defaultIpc / 100))
                      return (
                        <tr key={c.contractId} className="border-b border-slate-50 hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-mono text-xs text-slate-700">{c.unitNumber}</td>
                          <td className="px-4 py-2.5 text-slate-600">{c.clienteName}</td>
                          <td className="px-4 py-2.5 text-right text-slate-500">{formatCOP(c.lastCanon)}</td>
                          <td className="px-4 py-2.5 text-right font-medium text-slate-900">{formatCOP(newCanon)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
