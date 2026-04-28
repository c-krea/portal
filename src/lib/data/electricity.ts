import { execute } from "@/lib/db/executor"

export const ELECTRICITY_GROUPS = [
  { group: "CRA2710065", direccion: "Cra 27 10 65 (F2)",       proveedor: "NUE"       },
  { group: "CRA2710071", direccion: "Cra 27 10 71 (IMPARES)",  proveedor: "ENEL"      },
  { group: "CRA2710073", direccion: "Cra 27 10 73 (PARES)",    proveedor: "ENEL"      },
  { group: "CLL112733",  direccion: "Calle 11 27 33 (IMPARES)",proveedor: "NEU"       },
  { group: "CLL112739",  direccion: "Calle 11 27 39 (PARES)",  proveedor: "NEU REYMON"},
  { group: "CRA2710079", direccion: "Cra 27 10 79",            proveedor: "ENEL"      },
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
}

export async function getElectricityInvoices(
  empresaId: string,
  periodo: string,
): Promise<ElectricityInvoice[]> {
  const rows = await execute(`
    SELECT
      id,
      grupo_energia                  AS electricity_group,
      direccion,
      proveedor,
      fecha_factura::text            AS fecha_factura,
      valor_factura::numeric         AS valor_factura,
      kwh_factura::numeric           AS kwh_factura,
      tarifa_kwh::numeric            AS tarifa_kwh,
      notas
    FROM v2.facturas_energia
    WHERE empresa_id = '${empresaId}'::uuid AND periodo = '${periodo}'
  `)

  const byGroup = new Map(rows.map((r) => [String(r.electricity_group), r]))

  return ELECTRICITY_GROUPS.map(({ group, direccion, proveedor }) => {
    const r = byGroup.get(group)
    return {
      id:               r ? String(r.id) : null,
      electricity_group: group,
      direccion,
      proveedor,
      fecha_factura:    r?.fecha_factura ? String(r.fecha_factura) : null,
      valor_factura:    r ? Number(r.valor_factura) : 0,
      kwh_factura:      r ? Number(r.kwh_factura)   : 0,
      tarifa_kwh:       r ? Number(r.tarifa_kwh)     : 0,
      notas:            r?.notas ? String(r.notas) : null,
    }
  })
}

export async function getElectricityTarifaForUnit(
  empresaId: string,
  unitId: string,
  periodo: string,
): Promise<number> {
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
