import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

// max: 1 for Next.js server components (serverless — each request is isolated)
// prepare: false only needed for PgBouncer transaction pooler (not used here)
const client = postgres(connectionString, { max: 1 })

export const db = drizzle(client, { schema })
