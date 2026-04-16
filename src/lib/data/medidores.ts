import { db } from "@/lib/db/client"
import { sql } from "drizzle-orm"

export type UnitWithMeter = {
  unitId: string
  unitNumber: string
  unitCode: string
  tenantName: string | null
  hasReading: boolean
  lastPeriodo: string | null
  lastKwh: number | null
  lastTotal: number | null
}

export type MeterReadingRow = {
  id: string
  unitId: string
  unitNumber: string
  periodo: string
  lecturaAnterior: number
  lecturaActual: number
  kwh: number
  tarifaKwh: number
  totalEnergia: number
  notas: string | null
}

export async function getUnitsWithMeters(companyId: string): Promise<UnitWithMeter[]> {
  const rows = await db.execute(sql`
    SELECT
      u.id                                               AS unit_id,
      u.unit_number,
      u.unit_code,
      COALESCE(t.nombre_corto, t.razon_social)           AS tenant_name,
      mr_last.periodo                                    AS last_periodo,
      mr_last.kwh::numeric                               AS last_kwh,
      mr_last.total_energia::numeric                     AS last_total
    FROM units u
    LEFT JOIN contracts c
           ON c.unit_id = u.id
          AND c.company_id = ${companyId}::uuid
          AND c.status IN ('activo', 'critico')
    LEFT JOIN tenants t ON c.tenant_id = t.id
    LEFT JOIN LATERAL (
      SELECT periodo, kwh, total_energia
      FROM meter_readings
      WHERE unit_id = u.id
      ORDER BY periodo DESC
      LIMIT 1
    ) mr_last ON true
    WHERE u.company_id = ${companyId}::uuid
      AND u.has_electricity_meter = true
    ORDER BY u.unit_number
  `)

  return (rows as Array<Record<string, unknown>>).map((r) => ({
    unitId:      String(r.unit_id),
    unitNumber:  String(r.unit_number),
    unitCode:    String(r.unit_code),
    tenantName:  r.tenant_name ? String(r.tenant_name) : null,
    hasReading:  r.last_periodo != null,
    lastPeriodo: r.last_periodo ? String(r.last_periodo) : null,
    lastKwh:     r.last_kwh != null ? Number(r.last_kwh) : null,
    lastTotal:   r.last_total != null ? Number(r.last_total) : null,
  }))
}

export async function getMeterReadings(
  companyId: string,
  periodo?: string,
): Promise<MeterReadingRow[]> {
  const rows = await db.execute(sql`
    SELECT
      mr.id,
      mr.unit_id,
      u.unit_number,
      mr.periodo,
      mr.lectura_anterior::numeric AS lectura_anterior,
      mr.lectura_actual::numeric   AS lectura_actual,
      mr.kwh::numeric              AS kwh,
      mr.tarifa_kwh::numeric       AS tarifa_kwh,
      mr.total_energia::numeric    AS total_energia,
      mr.notas
    FROM meter_readings mr
    JOIN units u ON mr.unit_id = u.id
    WHERE mr.company_id = ${companyId}::uuid
      ${periodo ? sql`AND mr.periodo = ${periodo}` : sql``}
    ORDER BY mr.periodo DESC, u.unit_number
  `)

  return (rows as Array<Record<string, unknown>>).map((r) => ({
    id:              String(r.id),
    unitId:          String(r.unit_id),
    unitNumber:      String(r.unit_number),
    periodo:         String(r.periodo),
    lecturaAnterior: Number(r.lectura_anterior),
    lecturaActual:   Number(r.lectura_actual),
    kwh:             Number(r.kwh),
    tarifaKwh:       Number(r.tarifa_kwh),
    totalEnergia:    Number(r.total_energia),
    notas:           r.notas ? String(r.notas) : null,
  }))
}
