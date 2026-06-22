/**
 * lib/db.ts — Drizzle client for the FineGuard Next.js app.
 *
 * Uses drizzle-orm/postgres-js + postgres driver pointed at Supabase Postgres.
 * Lazy-init pattern: the connection is created on first call and cached for
 * the lifetime of the server process (dev hot-reload safe via globalThis cache).
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

const g = globalThis as unknown as { __fineguard_db?: DrizzleDb };

export async function getDb(): Promise<DrizzleDb> {
  if (g.__fineguard_db) return g.__fineguard_db;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not configured');

  const client = postgres(url, { max: 10 });
  const db = drizzle(client, { schema });

  g.__fineguard_db = db;

  return db;
}

// Re-export FineGuard schema table references
export {
  monitoredCompanies,
  fineguardLeads,
  alertHistory,
  leads,
  contacts,
} from '@/db/schema';
