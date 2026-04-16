/**
 * HTTP-based DB executor — uses Supabase REST API (HTTPS, IPv4, works from Vercel).
 * Replaces postgres.js / Drizzle runtime connection (which requires IPv6 TCP to Supabase).
 *
 * - execute(query)  → calls exec_sql() RPC for SELECT queries
 * - supabaseAdmin   → use .from().insert/update/upsert/delete() for writes
 */
import { createClient } from "@supabase/supabase-js"

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type Row = Record<string, unknown>

export async function execute(query: string): Promise<Row[]> {
  const { data, error } = await supabaseAdmin.rpc("exec_sql", { q: query })
  if (error) {
    throw new Error(`DB query failed: ${error.message}\nQuery: ${query.slice(0, 300)}`)
  }
  return (data ?? []) as Row[]
}
