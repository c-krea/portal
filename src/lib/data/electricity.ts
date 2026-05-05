import { execute } from "@/lib/db/executor"
import { assertPeriodo, assertUuid } from "@/lib/security/validators"

function periodoToLabel(periodo: string): string {
  const [y, m] = periodo.split("-")
  return `${y}/${m}`
}

export const ELECTRICITY_GROUPS = [
  { group: "CRA2710065", direccion: "CARRERA 27 #10-65", proveedor: "NUE",        contrato: "359580" },
  { group: "CRA2710071", direccion: "KR 27 N°10-71",    proveedor: "ENEL",       contrato: "359581" },
  { group: "CRA2710073", direccion: "KR 27 N°10-73",    proveedor: "ENEL",       contrato: "359583" },
  { group: "CLL112733",  direccion: "CALLE 11 #27-33",  proveedor: "NEU",        contrato: "354985" },
  { group: "CLL112739",  direccion: "CALLE 11 #27-39",  proveedor: "NEU REYMON", contrato: "902329" },
  { group: "CRA2710079", direccion: "KR 27 N°10-79",    proveedor: "ENEL",       contrato: "359585" },
] as const

export type ElectricityGroup = typeof ELECTRICITY_GROUPS[number]["group"]

export interface ElectricityInvoice {
  id: string | null
  electricity_group: string
  direccion: string
  proveedor: string
  fecha_factura: string | null
  valor_factura: number
  kwh_factura: number
  tarifa_kwh: number
  notas: string | null
  from_erp: boolean
}

export async function getElectricityInvoices(
  empresaId: string,
  periodo: string,
): Promise<ElectricityInvoice[]> {
  assertUuid(empresaId)
  assertPeriodo(periodo)

  // periodo "2026-04" → 202604 for siesa_raw
  const periodoInt = Number(periodo.replace("-", ""))

  // Conditions to match each group's contract number in siesa notas
  const contratoConditions = ELECTRICITY_GROUPS
    .map((g) => `WHEN er.notas ILIKE '%${g.contrato}%' THEN '${g.group}'`)
    .join("\n      ")
  const contratoFilter = ELECTRICITY_GROUPS
    .map((g) => `er.notas ILIKE '%${g.contrato}%'`)
    .join(" OR ")

  const [saved, siesa, readings] = await Promise.all([
    // 1. Manual records already saved in facturas_energia
    execute(`
      SELECT
        id,
        grupo_energia                  AS electricity_group,
        fecha_factura::text            AS fecha_factura,
        valor_factura::numeric         AS valor_factura,
        kwh_factura::numeric           AS kwh_factura,
        tarifa_kwh::numeric            AS tarifa_kwh,
        notas
      FROM v2.facturas_energia
      WHERE empresa_id = '${empresaId}'::uuid AND periodo = '${periodo}'
    `),

    // 2. Siesa raw: total bill value per group (sum all cost-center splits of same invoice)
    execute(`
      SELECT
        CASE ${contratoConditions}
        END                          AS grupo_energia,
        SUM(er.valor)                AS valor_factura
      FROM siesa_raw.estado_resultados er
      WHERE er.cuenta IN ('51353001', '52353001', '73353001')
        AND er.documento LIKE '001-FP%'
        AND er.valor > 0
        AND er.periodo = ${periodoInt}
        AND (${contratoFilter})
      GROUP BY 1
    `),

    // 3. Sum of tenant meter readings per address group → kwh_factura
    execute(`
      SELECT
        u.grupo_energia,
        SUM(lm.kwh)::numeric AS kwh_total
      FROM v2.lecturas_medidor lm
      JOIN v2.locales u ON u.id = lm.local_id
      WHERE lm.periodo   = '${periodo}'
        AND u.empresa_id = '${empresaId}'::uuid
        AND u.grupo_energia IS NOT NULL
      GROUP BY u.grupo_energia
    `),
  ])

  type Row = Record<string, unknown>
  const savedByGroup  = new Map((saved   as Row[]).map((r) => [String(r.electricity_group), r]))
  const siesaByGroup  = new Map((siesa   as Row[]).filter((r) => r.grupo_energia).map((r) => [String(r.grupo_energia), r]))
  const kwhByGroup    = new Map((readings as Row[]).map((r) => [String(r.grupo_energia), Number(r.kwh_total)]))

  return ELECTRICITY_GROUPS.map(({ group, direccion, proveedor }) => {
    const manual = savedByGroup.get(group)
    const erp    = siesaByGroup.get(group)
    const kwh    = kwhByGroup.get(group) ?? 0

    const valorFact = manual ? Number(manual.valor_factura) : (erp ? Number(erp.valor_factura) : 0)
    const kwhFact   = manual ? Number(manual.kwh_factura)   : kwh
    const tarifa    = manual ? Number(manual.tarifa_kwh)    : (valorFact > 0 && kwhFact > 0 ? valorFact / kwhFact : 0)

    return {
      id:                manual ? String(manual.id) : null,
      electricity_group: group,
      direccion,
      proveedor,
      fecha_factura:     manual?.fecha_factura ? String(manual.fecha_factura) : (erp ? periodoToLabel(periodo) : null),
      valor_factura:     valorFact,
      kwh_factura:       kwhFact,
      tarifa_kwh:        tarifa,
      notas:             manual?.notas ? String(manual.notas) : null,
      from_erp:          !manual && !!erp,
    }
  })
}

export async function getElectricityTarifaForUnit(
  empresaId: string,
  unitId: string,
  periodo: string,
): Promise<number> {
  assertUuid(empresaId)
  assertUuid(unitId)
  assertPeriodo(periodo)
  const rows = await execute(`
    SELECT ei.tarifa_kwh::numeric AS tarifa_kwh
    FROM v2.facturas_energia ei
    JOIN v2.locales u ON u.grupo_energia = ei.grupo_energia
    WHERE ei.empresa_id = '${empresaId}'::uuid
      AND ei.periodo    = '${periodo}'
      AND u.id          = '${unitId}'::uuid
    LIMIT 1
  `)
  return rows[0] ? Number(rows[0].tarifa_kwh) : 0
}
