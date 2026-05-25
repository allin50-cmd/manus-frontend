import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

type Db = ReturnType<typeof drizzle<typeof schema>>;

// Lazy initialization — pool is created on first database access, not at module load.
// Safe for Vercel cold starts: import succeeds even if DATABASE_URL is temporarily absent.
let _db: Db | undefined;
let _client: ReturnType<typeof postgres> | undefined;

function getDb(): Db {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL environment variable is not set');
  // On Vercel, many concurrent function instances each create their own pool.
  // Use max:1 per instance to avoid exhausting DB connection limits.
  // Use a connection pooler (PgBouncer / Neon / Supabase pooler) in production.
  const max = process.env.VERCEL ? 1 : 10;
  _client = postgres(url, {
    max,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  _db = drizzle(_client, { schema });
  return _db;
}

// Proxy forwards all property accesses to the lazily-created Drizzle instance.
// All existing call sites (db.select(), db.insert(), etc.) work without changes.
export const db = new Proxy({} as Db, {
  get(_, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
}) as Db;

export { schema };

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await getDb().execute('SELECT 1' as unknown as Parameters<Db['execute']>[0]);
    return true;
  } catch {
    return false;
  }
}
