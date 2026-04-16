import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

// max: 1 for serverless — each Lambda invocation is isolated
// prepare: false required for Supabase Supavisor transaction-mode pooler (port 6543)
const client = postgres(connectionString, { max: 1, prepare: false })

export const db = drizzle(client, { schema })
