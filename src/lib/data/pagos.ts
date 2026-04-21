import { execute } from "@/lib/db/executor"

export type PagoRow = {
  id: string
  tenantId: string
  clienteName: string
  unitNumber: string | null
  fechaRecaudo: string
  valorFinal: number
  siesaDocto: string | null
  siesaCruce: string | null
  status: string
}

export type TenantOption = {
  id: string
  label: string
  nit: string
}

export type PagosKPIs = {
  totalEsteMes: number
  totalMesAnterior: number
  countEsteMes: number
  ultimoPagoFecha: string | null
  ultimoPagoCliente: string | null
  ultimoPagoMonto: number | null
}

export async function getPagosKPIs(): Promise<PagosKPIs> {
  const rows = await execute(`
    WITH este_mes AS (
      SELECT COALESCE(SUM(p.valor_final), 0) AS total, COUNT(DISTINCT p.siesa_docto) AS cnt
      FROM payments p
      WHERE date_trunc('month', p.fecha_recaudo) = date_trunc('month', CURRENT_DATE)
        AND p.siesa_clasificacion IN ('RECAUDADO', 'VENCIDO')
    ),
    mes_anterior AS (
      SELECT COALESCE(SUM(p.valor_final), 0) AS total
      FROM payments p
      WHERE date_trunc('month', p.fecha_recaudo) = date_trunc('month', CURRENT_DATE - interval '1 month')
        AND p.siesa_clasificacion IN ('RECAUDADO', 'VENCIDO')
    ),
    ultimo AS (
      SELECT p.fecha_recaudo, COALESCE(t.nombre_corto, t.razon_social) AS cliente, p.valor_final
      FROM payments p
      JOIN tenants t ON t.id = p.tenant_id
      WHERE p.siesa_clasificacion IN ('RECAUDADO', 'VENCIDO')
      ORDER BY p.fecha_recaudo DESC, p.created_at DESC
      LIMIT 1
    )
    SELECT
      (SELECT total FROM este_mes)       AS total_este_mes,
      (SELECT cnt   FROM este_mes)       AS count_este_mes,
      (SELECT total FROM mes_anterior)   AS total_mes_anterior,
      (SELECT fecha_recaudo FROM ultimo) AS ultimo_fecha,
      (SELECT cliente       FROM ultimo) AS ultimo_cliente,
      (SELECT valor_final   FROM ultimo) AS ultimo_monto
  `)
  const r = rows[0] as Record<string, unknown>
  return {
    totalEsteMes:      Number(r.total_este_mes    ?? 0),
    totalMesAnterior:  Number(r.total_mes_anterior ?? 0),
    countEsteMes:      Number(r.count_este_mes     ?? 0),
    ultimoPagoFecha:   r.ultimo_fecha   ? String(r.ultimo_fecha)   : null,
    ultimoPagoCliente: r.ultimo_cliente ? String(r.ultimo_cliente) : null,
    ultimoPagoMonto:   r.ultimo_monto   ? Number(r.ultimo_monto)   : null,
  }
}

export async function getPagos(limit = 200): Promise<PagoRow[]> {
  const rows = await execute(`
    SELECT
      p.id,
      p.tenant_id,
      COALESCE(t.nombre_corto, t.razon_social) AS cliente_name,
      u.unit_number,
      p.fecha_recaudo,
      COALESCE(p.valor_final, 0)::numeric       AS valor_final,
      p.siesa_docto,
      p.siesa_cruce,
      p.status
    FROM payments p
    JOIN tenants t ON t.id = p.tenant_id
    LEFT JOIN contracts c
      ON c.tenant_id = p.tenant_id
      AND c.status IN ('activo', 'critico', 'vencido', 'terminado')
    LEFT JOIN units u ON c.unit_id = u.id
    ORDER BY p.fecha_recaudo DESC, p.created_at DESC
    LIMIT ${limit}
  `)
  return rows.map((r) => ({
    id:            String(r.id),
    tenantId:      String(r.tenant_id),
    clienteName:   String(r.cliente_name),
    unitNumber:    r.unit_number ? String(r.unit_number) : null,
    fechaRecaudo:  String(r.fecha_recaudo),
    valorFinal:    Number(r.valor_final ?? 0),
    siesaDocto:    r.siesa_docto ? String(r.siesa_docto) : null,
    siesaCruce:    r.siesa_cruce ? String(r.siesa_cruce) : null,
    status:        String(r.status),
  }))
}
