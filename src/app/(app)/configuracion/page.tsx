import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { RuleForm } from "@/components/configuracion/rule-form"
import { InfoTip } from "@/components/pagos/info-tip"
import { getFinancialRules, RULE_LABELS } from "@/lib/data/configuracion"
import { getEmpresaCkreaId } from "@/lib/empresa"

export default async function ConfiguracionPage() {
  const empresaId = await getEmpresaCkreaId()
  // Only keys with a human label render — interes_mora_diario stays hidden
  // (its rate is administered on /mora) and no raw rule key can ever leak.
  const rules = (await getFinancialRules(empresaId)).filter((rule) => rule.ruleKey in RULE_LABELS)

  return (
    <>
      <PageHeader title="Configuración" />

      <div className="overflow-hidden rounded-[10px] border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Parámetros financieros</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Afectan la facturación y los descuentos. Los cambios aplican a la próxima operación.
          </p>
        </div>

        <div className="divide-y divide-slate-50 px-4">
          {rules.map((rule) => {
            const meta = RULE_LABELS[rule.ruleKey] ?? {
              label: rule.ruleKey,
              unit: "",
              hint: rule.description ?? "",
            }
            return (
              <div
                key={rule.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-1 text-sm font-medium text-slate-800">
                    {meta.label}
                    {meta.hint && <InfoTip text={meta.hint} />}
                  </p>
                </div>
                <div className="shrink-0">
                  <RuleForm
                    id={rule.id}
                    ruleKey={rule.ruleKey}
                    label={meta.label}
                    currentValue={rule.ruleValue}
                    unit={meta.unit}
                    displayPercent={meta.displayPercent}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        La tasa de interés de mora se configura en{" "}
        <Link href="/mora" className="font-medium text-slate-600 underline hover:text-slate-800">
          Mora
        </Link>
        .
      </p>
    </>
  )
}
