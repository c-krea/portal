// postgres.js removed — DB connection now uses HTTP via executor.ts (Supabase REST API)
// Drizzle schema types still imported from schema/ for TypeScript compatibility
export { execute, supabaseAdmin } from "@/lib/db/executor"
