"use client"

import { useActionState, useState } from "react"
import { saveFacturasEnergia, type SaveFacturasState } from "./actions"
import type { ElectricityInvoice } from "@/lib/data/electricity"
import { CheckCircle2 } from "lucide-react"

const initial: SaveFacturasState = {}

function formatCOP(n: number) {
  return n > 0
    ? `$ ${Math.round(n).toLocaleString("es-CO")}`
    : "—"
}

function formatKwh(valor: number, tarifa: number) {
  if (valor > 0 && tarifa > 0) return `${Math.round(valor / tarifa).toLocaleString("es-CO")} kWh`
  return "—"
}

export function InvoiceForm({
  periodo,
  invoices,
}: {
  periodo: string
  invoices: ElectricityInvoice[]
}) {
  const [state, action, pending] = useActionState(saveFacturasEnergia, initial)

  const [values, setValues] = useState<Record<string, { valor: string; tarifa: string }>>(() =>
    Object.fromEntries(
      invoices.map((inv) => [
        inv.electricity_group,
        {
          valor:  inv.valor_factura > 0 ? String(inv.valor_factura) : "",
          tarifa: inv.tarifa_kwh    > 0 ? String(inv.tarifa_kwh)    : "",
        },
      ])
    )
  )

  function set(group: string, field: "valor" | "tarifa", val: string) {
    setValues((prev) => ({ ...prev, [group]: { ...prev[group], [field]: val } }))
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="periodo" value={periodo} />

      {state.error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          Facturas guardadas correctamente.
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 text-left">Dirección</th>
              <th className="px-4 py-3 text-left">Proveedor</th>
              <th className="px-4 py-3 text-left">Fecha factura</th>
              <th className="px-4 py-3 text-left">Valor factura (COP)</th>
              <th className="px-4 py-3 text-left">Tarifa ($/kWh)</th>
              <th className="px-4 py-3 text-left">kWh edificio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map((inv) => {
              const v = values[inv.electricity_group]
              const kwhEdificio = formatKwh(Number(v?.valor || 0), Number(v?.tarifa || 0))
              const hasValues = Number(v?.valor || 0) > 0 && Number(v?.tarifa || 0) > 0

              return (
                <tr key={inv.electricity_group} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-800">{inv.direccion}</p>
                      {inv.from_erp && (
                        <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                          ERP
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      {inv.proveedor}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="date"
                      name={`fecha_${inv.electricity_group}`}
                      defaultValue={inv.fecha_factura ?? ""}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      name={`valor_${inv.electricity_group}`}
                      value={v?.valor ?? ""}
                      onChange={(e) => set(inv.electricity_group, "valor", e.target.value)}
                      placeholder="0"
                      min={0}
                      step={1}
                      className="w-40 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      name={`tarifa_${inv.electricity_group}`}
                      value={v?.tarifa ?? ""}
                      onChange={(e) => set(inv.electricity_group, "tarifa", e.target.value)}
                      placeholder="0.00"
                      min={0}
                      step={0.01}
                      className="w-32 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold tabular-nums ${hasValues ? "text-slate-900" : "text-slate-300"}`}>
                      {kwhEdificio}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 bg-slate-50">
              <td colSpan={3} className="px-4 py-3 text-xs text-slate-500">
                kWh edificio = Valor Factura ÷ Tarifa. La tarifa se aplica a cada unidad del grupo.
              </td>
              <td className="px-4 py-3">
                <span className="text-xs font-semibold text-slate-700">
                  Total: {formatCOP(
                    invoices.reduce((s, inv) => s + Number(values[inv.electricity_group]?.valor || 0), 0)
                  )}
                </span>
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 transition-colors"
        >
          {pending ? "Guardando…" : "Guardar facturas"}
        </button>
      </div>
    </form>
  )
}
