"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Download, Trash2, FolderOpen, FileText, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { getDownloadUrl, deleteArchivo } from "./actions"
import type { R2File } from "@/lib/r2/files"

type Props = { archivos: R2File[] }

const TYPE_LABEL: Record<R2File["type"], string> = {
  factura: "Factura",
  medidor: "Foto medidor",
  otro: "Otro",
}

const TYPE_ICON: Record<R2File["type"], React.ReactNode> = {
  factura: <FileText className="h-4 w-4 text-blue-500" />,
  medidor: <Camera className="h-4 w-4 text-emerald-500" />,
  otro: <FolderOpen className="h-4 w-4 text-slate-400" />,
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ArchivosClient({ archivos }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [deletingKey, setDeletingKey] = useState<string | null>(null)
  const [tipoFilter, setTipoFilter] = useState<string>("todos")
  const [periodoFilter, setPeriodoFilter] = useState<string>("todos")

  const periodos = Array.from(new Set(archivos.map((f) => f.periodo).filter(Boolean))).sort().reverse()

  const filtered = archivos.filter((f) => {
    if (tipoFilter !== "todos" && f.type !== tipoFilter) return false
    if (periodoFilter !== "todos" && f.periodo !== periodoFilter) return false
    return true
  })

  function handleDownload(key: string) {
    setLoadingKey(key)
    startTransition(async () => {
      const url = await getDownloadUrl(key)
      window.open(url, "_blank")
      setLoadingKey(null)
    })
  }

  function handleDelete(key: string) {
    if (!confirm(`¿Eliminar ${key}? Esta acción no se puede deshacer.`)) return
    setDeletingKey(key)
    startTransition(async () => {
      await deleteArchivo(key)
      setDeletingKey(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={tipoFilter} onValueChange={(v) => setTipoFilter(v ?? "todos")}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            <SelectItem value="factura">Facturas</SelectItem>
            <SelectItem value="medidor">Fotos medidor</SelectItem>
            <SelectItem value="otro">Otros</SelectItem>
          </SelectContent>
        </Select>

        <Select value={periodoFilter} onValueChange={(v) => setPeriodoFilter(v ?? "todos")}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los períodos</SelectItem>
            {periodos.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-sm text-slate-500">
          {filtered.length} {filtered.length === 1 ? "archivo" : "archivos"}
        </span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-20 text-center">
          <FolderOpen className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-500">Sin archivos</p>
          <p className="text-xs text-slate-400 mt-1">
            Los archivos aparecerán aquí una vez que generes facturas o subas fotos de medidores.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left font-medium text-slate-600">Tipo</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Archivo</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Local</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Período</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Fecha</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Tamaño</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((file) => (
                <tr
                  key={file.key}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {TYPE_ICON[file.type]}
                      <Badge variant="outline" className="text-xs font-normal">
                        {TYPE_LABEL[file.type]}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600 max-w-[200px] truncate">
                    {file.nombre}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {file.local !== "—" ? `Local ${file.local}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{file.periodo || "—"}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {file.lastModified.toLocaleDateString("es-CO", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatSize(file.size)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(file.key)}
                        disabled={loadingKey === file.key || pending}
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        {loadingKey === file.key ? "..." : "Abrir"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(file.key)}
                        disabled={deletingKey === file.key || pending}
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
