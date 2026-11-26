"use server"

import { requireStaffAction } from "@/lib/auth/session"
import { execute } from "@/lib/db/executor"
import { isValidUuid } from "@/lib/security/validators"
import type { EstadoCuentaData } from "@/lib/pdf/estado-cuenta"

/**
 * Data for the tenant's "Estado de Cuenta" PDF: every open document in the
 * current SIESA cartera (v2.vista_cartera_actual), with SIESA's own due date
 * and días de mora — the same figures the cartera table shows on /locales/[id].
 */
export async function getEstadoCuenta(
  tenantId: string,
): Promise<{ data: EstadoCuentaData } | { error: string }> {
  const auth = await requireStaffAction()
  if ("error" in auth) return { error: auth.error }
  if (!isValidUuid(tenantId)) return { error: "Arrendatario inválido" }

  const [tenant] = await execute(`
    SELECT COALESCE(t.razon_social, t.nombre_corto) AS nombre, t.nit
    FROM v2.inquilinos t WHERE t.id = '${tenantId}'::uuid LIMIT 1
  `)
  if (!tenant) return { error: "Arrendatario no encontrado" }

  const rows = await execute(`
    SELECT v.factura, v.fecha_factura::date::text AS fecha_factura,
           v.fecha_vencimiento::date::text AS fecha_vence,
           COALESCE(v.dias_mora, 0) AS dias_mora,
           COALESCE(v.saldo, 0)::numeric AS saldo,
           COALESCE(v.vr_vencido, 0)::numeric AS vencido,
           v.zona
    FROM v2.vista_cartera_actual v
    WHERE v.inquilino_id = '${tenantId}'::uuid
    ORDER BY v.fecha_factura, v.factura
  `)

  return {
    data: {
      nombre: String(tenant.nombre ?? ""),
      nit: String(tenant.nit ?? ""),
      zona: (rows.find((r) => r.zona)?.zona as string | undefined) ?? null,
      documentos: rows.map((r) => ({
        factura: String(r.factura ?? "—"),
        fechaFactura: r.fecha_factura ? String(r.fecha_factura) : null,
        fechaVence: r.fecha_vence ? String(r.fecha_vence) : null,
        diasMora: Number(r.dias_mora ?? 0),
        saldo: Number(r.saldo ?? 0),
        vencido: Number(r.vencido ?? 0),
      })),
    },
  }
}
