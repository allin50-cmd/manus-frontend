// lib/db.ts — dual-ORM transition layer
//
// PRISMA (legacy routes): exported as `db` — lazy init so module import does not
// crash in environments where the Prisma binary has not been generated.
//
// DRIZZLE (new /api/os/ routes): exported via `getDb()` and schema table re-exports.

import { PrismaClient } from '@prisma/client'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from '../db/schema'

// ── Prisma (lazy) ─────────────────────────────────────────────────────────────

type AnyPrisma = PrismaClient & Record<string, unknown>

let _prisma: AnyPrisma | null = null

function getPrisma(): AnyPrisma {
  if (!_prisma) {
    _prisma = new PrismaClient() as AnyPrisma
  }
  return _prisma
}

// Proxy ensures module-level import does not trigger PrismaClient constructor.
// Accessing any property of `db` will initialize on first use.
export const db = new Proxy({} as AnyPrisma, {
  get(_target, prop: string) {
    return getPrisma()[prop]
  },
})

// ── Drizzle (new OS routes) ───────────────────────────────────────────────────

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>

const g = globalThis as unknown as { __drizzle_db?: DrizzleDb }

export function getDb(): DrizzleDb {
  if (g.__drizzle_db) return g.__drizzle_db
  const url = process.env.DATABASE_URL
  if (!url) {
    // Return a non-connecting client during tests / build — queries will fail at
    // runtime, but module import will not throw.
    const client = postgres('postgres://localhost/noop', { max: 1 })
    g.__drizzle_db = drizzle(client, { schema })
    return g.__drizzle_db
  }
  const client = postgres(url, { ssl: 'require', max: 10 })
  g.__drizzle_db = drizzle(client, { schema })
  return g.__drizzle_db
}

// Re-export Drizzle schema tables needed by /api/os/ routes
export {
  osMessageThreads,
  osPeople,
  osTasks,
  osCallLogs,
  osMessages,
  osQuotes,
  osInvoices,
  osDocuments,
} from '../db/schema'
