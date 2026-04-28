import { execute, supabaseAdmin } from "@/lib/db/executor"

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

export type MedidorAdminRow = {
  unitId: string
  unitNumber: string
  tenantName: string | null
  kwh: number | null
  promedio3m: number | null
  desvPct: number | null
  totalEnergia: number | null
  status: "registrada" | "sin_lectura"
  readingId: string | null
  validationStatus: "pendiente" | "aprobado" | "revision" | "sin_lectura" | null
  fotoUrl: string | null
}

export async function getMedidoresAdmin(
  empresaId: string,
  periodo: string,
): Promise<MedidorAdminRow[]> {
  const rows = await execute(`
    SELECT
      u.id                                               AS unit_id,
      u.unidad                                           AS unit_number,
      COALESCE(t.nombre_corto, t.razon_social)           AS tenant_name,
      mr.id                                              AS reading_id,
      mr.kwh::numeric                                    AS kwh,
      mr.total_energia::numeric                          AS total_energia,
      mr.estado_validacion                               AS validation_status,
      mr.foto_url,
      avg3.promedio_3m
    FROM v2.locales u
    LEFT JOIN v2.contratos c
           ON c.local_id = u.id
          AND c.empresa_id = '${empresaId}'::uuid
          AND c.estado IN ('activo', 'critico')
    LEFT JOIN v2.inquilinos t ON c.inquilino_id = t.id
    LEFT JOIN v2.lecturas_medidor mr
           ON mr.local_id = u.id
          AND mr.periodo  = '${periodo}'
    LEFT JOIN LATERAL (
      SELECT ROUND(AVG(mr2.kwh), 0) AS promedio_3m
      FROM (
        SELECT kwh FROM v2.lecturas_medidor
        WHERE local_id = u.id AND periodo < '${periodo}'
        ORDER BY periodo DESC LIMIT 3
      ) mr2
    ) avg3 ON true
    WHERE u.empresa_id = '${empresaId}'::uuid
    ORDER BY u.unidad
  `)

  return (rows as Array<Record<string, unknown>>).map((r) => {
    const kwh = r.kwh != null ? Number(r.kwh) : null
    const p3m = r.promedio_3m != null ? Number(r.promedio_3m) : null
    const desv = kwh != null && p3m != null && p3m > 0
      ? Math.round(((kwh - p3m) / p3m) * 100)
      : null
    return {
      unitId:      String(r.unit_id),
      unitNumber:  String(r.unit_number),
      tenantName:  r.tenant_name ? String(r.tenant_name) : null,
      readingId:   r.reading_id ? String(r.reading_id) : null,
      kwh,
      promedio3m:  p3m,
      desvPct:     desv,
      totalEnergia: r.total_energia != null ? Number(r.total_energia) : null,
      status:           r.reading_id ? "registrada" : "sin_lectura",
      validationStatus: r.reading_id
        ? ((r.validation_status as string | null) ?? "pendiente") as MedidorAdminRow["validationStatus"]
        : "sin_lectura",
      fotoUrl: r.foto_url ? String(r.foto_url) : null,
    }
  })
}

export async function getUnitsWithMeters(empresaId: string): Promise<UnitWithMeter[]> {
  const rows = await execute(`
    SELECT
      u.id                                               AS unit_id,
      u.unidad                                           AS unit_number,
      u.codigo                                           AS unit_code,
      COALESCE(t.nombre_corto, t.razon_social)           AS tenant_name,
      mr_last.periodo                                    AS last_periodo,
      mr_last.kwh::numeric                               AS last_kwh,
      mr_last.total_energia::numeric                     AS last_total
    FROM v2.locales u
    LEFT JOIN v2.contratos c
           ON c.local_id = u.id
          AND c.empresa_id = '${empresaId}'::uuid
          AND c.estado IN ('activo', 'critico')
    LEFT JOIN v2.inquilinos t ON c.inquilino_id = t.id
    LEFT JOIN LATERAL (
      SELECT periodo, kwh, total_energia
      FROM v2.lecturas_medidor
      WHERE local_id = u.id
      ORDER BY periodo DESC
      LIMIT 1
    ) mr_last ON true
    WHERE u.empresa_id = '${empresaId}'::uuid
    ORDER BY u.unidad
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
  empresaId: string,
  periodo?: string,
): Promise<MeterReadingRow[]> {
  const rows = await execute(`
    SELECT
      mr.id,
      mr.local_id                       AS unit_id,
      u.unidad                          AS unit_number,
      mr.periodo,
      mr.lectura_anterior::numeric      AS lectura_anterior,
      mr.lectura_actual::numeric        AS lectura_actual,
      mr.kwh::numeric                   AS kwh,
      mr.tarifa_kwh::numeric            AS tarifa_kwh,
      mr.total_energia::numeric         AS total_energia,
      mr.notas
    FROM v2.lecturas_medidor mr
    JOIN v2.locales u ON mr.local_id = u.id
    WHERE mr.empresa_id = '${empresaId}'::uuid
      ${periodo ? `AND mr.periodo = '${periodo}'` : ``}
    ORDER BY mr.periodo DESC, u.unidad
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

export async function upsertMeterReading(reading: {
  empresaId: string
  unitId: string
  periodo: string
  lecturaAnterior: string
  lecturaActual: string
  kwh: string
  tarifaKwh: string
  totalEnergia: string
  notas: string | null
}): Promise<void> {
  const { error } = await supabaseAdmin
    .schema("v2")
    .from("lecturas_medidor")
    .upsert(
      {
        empresa_id:       reading.empresaId,
        local_id:         reading.unitId,
        periodo:          reading.periodo,
        lectura_anterior: reading.lecturaAnterior,
        lectura_actual:   reading.lecturaActual,
        kwh:              reading.kwh,
        tarifa_kwh:       reading.tarifaKwh,
        total_energia:    reading.totalEnergia,
        notas:            reading.notas,
      },
      { onConflict: "local_id,periodo" },
    )
  if (error) throw new Error(error.message)
}
