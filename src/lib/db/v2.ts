/**
 * v2 schema client helper.
 *
 * Use for typed CRUD against v2 tables:
 *   const { data } = await v2().from('inquilinos').select()
 *
 * For raw SQL, use `execute()` from executor.ts directly with `FROM v2.<table>`.
 */
import { supabaseAdmin } from './executor'

export function v2() {
  return supabaseAdmin.schema('v2')
}
