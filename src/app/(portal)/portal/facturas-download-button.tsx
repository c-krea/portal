"use client"

import { useState, useEffect } from "react"
import { Download, FileText, X, Loader2, ChevronRight, ChevronLeft } from "lucide-react"
import { PDFDownloadLink } from "@react-pdf/renderer"
import { ElectricityInvoicePDF } from "@/lib/pdf/electricity-invoice"
import { fetchElectricityInvoiceForDownload } from "./actions"
import type { PortalElectricityInvoiceData } from "@/lib/data/portal"

type UnitOption = { unitId: string; unitNumber: string; periodos: string[] }

function periodoLabel(periodo: string): string {
  const [year, month] = periodo.split("-")
  const date = new Date(Number(year), Number(month) - 1, 1)
  const label = date.toLocaleDateString("es-CO", { month: "long", year: "numeric" })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function FacturasDownloadButton({
  nombre,
  nit,
  units,
}: {
  nombre: string
  nit: string
  units: UnitOption[]
}) {
  const [open, setOpen]               = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<UnitOption | null>(null)
  const [selectedPeriodo, setSelectedPeriodo] = useState<string | null>(null)
  const [invoiceData, setInvoiceData] = useState<PortalElectricityInvoiceData | null>(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [isMounted, setIsMounted]     = useState(false)

  useEffect(() => { setIsMounted(true) }, [])

  if (units.length === 0) return null

  const isSingleUnit = units.length === 1

  function handleOpen() {
    setOpen(true)
    // Skip unit step if only one unit
    if (isSingleUnit) setSelectedUnit(units[0])
  }

  function handleClose() {
    setOpen(false)
    setSelectedUnit(null)
    setSelectedPeriodo(null)
    setInvoiceData(null)
    setError(null)
  }

  function handleBack() {
    if (selectedUnit && !isSingleUnit) {
      setSelectedUnit(null)
      setSelectedPeriodo(null)
      setInvoiceData(null)
      setError(null)
    }
  }

  async function handleSelectPeriodo(periodo: string) {
    if (!selectedUnit) return
    setSelectedPeriodo(periodo)
    setInvoiceData(null)
    setError(null)
    setLoading(true)
    try {
      const data = await fetchElectricityInvoiceForDownload(selectedUnit.unitId, periodo)
      if (!data) setError("No se encontró factura para este período.")
      else setInvoiceData(data)
    } catch {
      setError("Error al cargar la factura.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 active:bg-slate-100"
      >
        <FileText className="h-4 w-4 text-slate-500" />
        Descargar factura de energía
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={handleClose}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >

            {/* Header */}
            <div className="mb-5 flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {selectedUnit && !isSingleUnit && (
                  <button onClick={handleBack} className="text-slate-400 hover:text-slate-600">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Factura de energía</h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {!selectedUnit
                      ? "Seleccione el local"
                      : `Local ${selectedUnit.unitNumber} — Seleccione el mes`}
                  </p>
                </div>
              </div>
              <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Step 1 — unit picker (multi-unit only) */}
            {!selectedUnit && (
              <div className="space-y-2 mb-5">
                {units.map(u => (
                  <button
                    key={u.unitId}
                    onClick={() => setSelectedUnit(u)}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                  >
                    <span>Local {u.unitNumber}</span>
                    <ChevronRight className="h-4 w-4 opacity-40" />
                  </button>
                ))}
              </div>
            )}

            {/* Step 2 — period picker */}
            {selectedUnit && (
              <>
                <div className="space-y-2 mb-5">
                  {selectedUnit.periodos.map(periodo => (
                    <button
                      key={periodo}
                      onClick={() => handleSelectPeriodo(periodo)}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                        selectedPeriodo === periodo
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span>{periodoLabel(periodo)}</span>
                      <ChevronRight className="h-4 w-4 opacity-40" />
                    </button>
                  ))}
                </div>

                {/* Loading */}
                {loading && (
                  <div className="flex items-center justify-center gap-2 py-3 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando factura...
                  </div>
                )}

                {/* Error */}
                {error && (
                  <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
                )}

                {/* Download button */}
                {isMounted && invoiceData && !loading && (
                  <PDFDownloadLink
                    document={
                      <ElectricityInvoicePDF
                        nombre={nombre}
                        nit={nit}
                        proveedor={invoiceData.proveedor}
                        proveedorNit={invoiceData.proveedorNit}
                        contrato={invoiceData.contrato}
                        periodo={invoiceData.periodoLabel}
                        consumoKwh={invoiceData.consumoKwh}
                        direccion={invoiceData.direccion}
                        total={invoiceData.total}
                      />
                    }
                    fileName={`cuenta-cobro-energia-local${selectedUnit.unitNumber}-${invoiceData.periodoKey}.pdf`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
                  >
                    {({ loading: pdfLoading }) =>
                      pdfLoading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" />Generando PDF...</>
                      ) : (
                        <><Download className="h-4 w-4" />Descargar — Local {selectedUnit.unitNumber} · {periodoLabel(invoiceData.periodoKey)}</>
                      )
                    }
                  </PDFDownloadLink>
                )}
              </>
            )}

          </div>
        </div>
      )}
    </>
  )
}
