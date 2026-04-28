/**
 * Empresa helper. Single-empresa setup (C-Krea).
 * Lazy-loads UUID from v2.empresas by NIT, caches per server boot.
 */
import { execute } from './db/executor'

const NIT_CKREA = '900123456'

let cachedEmpresaId: string | null = null

export async function getEmpresaCkreaId(): Promise<string> {
  if (cachedEmpresaId) return cachedEmpresaId

  const rows = await execute(
    `SELECT id FROM v2.empresas WHERE nit = '${NIT_CKREA}' LIMIT 1`
  )

  if (!rows[0]) {
    throw new Error(`v2.empresas no contiene C-Krea (NIT ${NIT_CKREA}). Corre G.2.`)
  }

  cachedEmpresaId = String(rows[0].id)
  return cachedEmpresaId
}
