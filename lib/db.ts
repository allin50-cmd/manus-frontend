/**
 * lib/db.ts — Drizzle client for Next.js app routes.
 *
 * Uses drizzle-orm/postgres-js + postgres driver pointed at Supabase Postgres.
 * Lazy-init pattern: the connection is created on first call and cached for
 * the lifetime of the server process (dev hot-reload safe via globalThis cache).
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

const g = globalThis as unknown as { __sheetops_db?: DrizzleDb };

export async function getDb(): Promise<DrizzleDb> {
  if (g.__sheetops_db) return g.__sheetops_db;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not configured');

  const client = postgres(url, { max: 10 });
  const db = drizzle(client, { schema });

  g.__sheetops_db = db;

  return db;
}

// Re-export schema table references so callers can import from one place
export {
  workItems,
  actions,
  activityLogs,
  decisions,
  templates,
} from '@/db/schema';
