import { PageHeader } from "@/components/layout/page-header"
import { RuleForm } from "@/components/configuracion/rule-form"
import { getFinancialRules, RULE_LABELS } from "@/lib/data/configuracion"
import { getEmpresaCkreaId } from "@/lib/empresa"

export default async function ConfiguracionPage() {
  const empresaId = await getEmpresaCkreaId()
  const rules = await getFinancialRules(empresaId)

  return (
    <>
      <PageHeader title="Configuración" />

      <div className="space-y-6">
        {/* Financial Rules */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-slate-900">Parámetros Financieros</h2>
          <p className="mb-6 text-xs text-slate-400">
            Afectan facturación, intereses y descuentos. Los cambios aplican a la próxima operación.
          </p>

          <div className="divide-y divide-slate-50">
            {rules.map((rule) => {
              const meta = RULE_LABELS[rule.ruleKey] ?? {
                label: rule.ruleKey,
                unit: "",
                hint: rule.description ?? "",
              }
              return (
                <div
                  key={rule.id}
                  className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">{meta.label}</p>
                    <p className="text-xs text-slate-400">{rule.description}</p>
                  </div>
                  <div className="shrink-0">
                    <RuleForm
                      id={rule.id}
                      ruleKey={rule.ruleKey}
                      currentValue={rule.ruleValue}
                      unit={meta.unit}
                      hint={meta.hint}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Interest Accrual Cron Info */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-slate-900">Automatizaciones</h2>
          <p className="mb-4 text-xs text-slate-400">Tareas programadas en Vercel.</p>
          <div className="flex items-center justify-between py-3 border-b border-slate-50">
            <div>
              <p className="text-sm font-medium text-slate-800">Cálculo de intereses de mora</p>
              <p className="text-xs text-slate-400">Diario · 01:00 COT · <code className="font-mono">/api/cron/accrual</code></p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              Activo
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
