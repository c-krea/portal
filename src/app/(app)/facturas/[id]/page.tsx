import { notFound } from "next/navigation"
import Link from "next/link"
import { getFacturaById } from "@/lib/data/facturas"
import { formatCOP } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import { EmitButton } from "@/components/facturas/emit-button"
import { PrintButton } from "@/components/facturas/print-button"

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  borrador: { label: "Borrador",  cls: "bg-slate-100 text-slate-600" },
  emitida:  { label: "Emitida",   cls: "bg-blue-100 text-blue-700" },
  pagada:   { label: "Pagada",    cls: "bg-emerald-100 text-emerald-700" },
  parcial:  { label: "Parcial",   cls: "bg-amber-100 text-amber-700" },
  vencida:  { label: "Vencida",   cls: "bg-rose-100 text-rose-700" },
  anulada:  { label: "Anulada",   cls: "bg-slate-100 text-slate-400" },
}

export default async function FacturaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const factura = await getFacturaById(id)
  if (!factura) notFound()

  const cfg = STATUS_CONFIG[factura.status] ?? { label: factura.status, cls: "bg-slate-100 text-slate-500" }

  return (
    <>
      {/* Toolbar — hidden on print */}
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link
          href="/facturas"
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Facturas
        </Link>
        <div className="flex gap-2">
          {factura.status === "borrador" && (
            <EmitButton invoiceId={factura.id} />
          )}
          <PrintButton />
        </div>
      </div>

      {/* Invoice document */}
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm print:shadow-none print:border-none print:max-w-none">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{factura.companyName}</h1>
            <p className="text-sm text-slate-500">NIT {factura.companyNit}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", cfg.cls)}>
                {cfg.label}
              </span>
              <p className="text-lg font-semibold text-slate-800">
                Factura {factura.periodo}
              </p>
            </div>
            <p className="mt-1 font-mono text-sm text-slate-500">Local {factura.unitNumber}</p>
          </div>
        </div>

        {/* Bill to / dates */}
        <div className="mt-6 grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Facturar a</p>
            <p className="mt-1 font-semibold text-slate-900">{factura.clienteName}</p>
            <p className="text-sm text-slate-500">NIT {factura.tenantNit}</p>
            {factura.tenantEmail && (
              <p className="text-sm text-slate-500">{factura.tenantEmail}</p>
            )}
            {factura.tenantTelefono && (
              <p className="text-sm text-slate-500">{factura.tenantTelefono}</p>
            )}
          </div>
          <div className="text-right">
            <div className="space-y-1 text-sm">
              <div className="flex justify-end gap-8">
                <span className="text-slate-500">Fecha emisión</span>
                <span className="font-medium text-slate-800">{factura.fechaEmision}</span>
              </div>
              <div className="flex justify-end gap-8">
                <span className="text-slate-500">Fecha vencimiento</span>
                <span className="font-medium text-slate-800">{factura.fechaVencimiento}</span>
              </div>
              {factura.fechaProntoPago && (
                <div className="flex justify-end gap-8">
                  <span className="text-slate-500">Pronto pago hasta</span>
                  <span className="font-medium text-emerald-600">{factura.fechaProntoPago}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Line items */}
        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                Concepto
              </th>
              <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                Valor
              </th>
            </tr>
          </thead>
          <tbody>
            {factura.lineItems.map((li) => (
              <tr key={li.id} className="border-b border-slate-50">
                <td className="py-2.5 text-slate-700">{li.description}</td>
                <td
                  className={cn(
                    "py-2.5 text-right font-medium",
                    li.amount < 0 ? "text-emerald-600" : "text-slate-900",
                  )}
                >
                  {formatCOP(li.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-4 flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal canon</span>
              <span className="text-slate-700">{formatCOP(factura.subtotalCanon)}</span>
            </div>
            {factura.subtotalDescuentos > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">Descuentos</span>
                <span className="text-emerald-600">−{formatCOP(factura.subtotalDescuentos)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">IVA 19%</span>
              <span className="text-slate-700">{formatCOP(factura.iva)}</span>
            </div>
            {factura.subtotalGastos > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">Energía eléctrica</span>
                <span className="text-slate-700">{formatCOP(factura.subtotalGastos)}</span>
              </div>
            )}
            {factura.subtotalProntoPago > 0 && (
              <div className="flex justify-between rounded bg-emerald-50 px-2 py-1 text-xs">
                <span className="text-emerald-700">
                  Descuento PP (si paga antes de {factura.fechaProntoPago})
                </span>
                <span className="font-semibold text-emerald-700">
                  −{formatCOP(factura.subtotalProntoPago)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <span className="font-semibold text-slate-800">Total</span>
              <span className="text-lg font-bold text-slate-900">{formatCOP(factura.total)}</span>
            </div>
            {factura.saldo < factura.total && (
              <div className="flex justify-between">
                <span className="text-slate-500">Saldo pendiente</span>
                <span
                  className={cn(
                    "font-semibold",
                    factura.saldo === 0 ? "text-emerald-600" : "text-rose-600",
                  )}
                >
                  {factura.saldo === 0 ? "Pagado" : formatCOP(factura.saldo)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 border-t border-slate-100 pt-4 text-center text-xs text-slate-400 print:mt-16">
          <p>Central Kreativa — Carrera 13A #93-66, Bogotá D.C.</p>
          <p className="mt-0.5">
            Este documento es generado por C-Krea PayControl · Local {factura.unitNumber} · {factura.unitCode}
          </p>
        </div>
      </div>
    </>
  )
}
