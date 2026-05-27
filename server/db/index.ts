import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import { neonConfig, Pool } from '@neondatabase/serverless';
import postgres from 'postgres';
import ws from 'ws';
import * as schema from './schema';

// Local dev: Neon serverless driver needs a WebSocket constructor.
// On Vercel (Node.js runtime) the native WebSocket is available; locally we
// polyfill with the `ws` package so the same driver path works everywhere.
if (typeof WebSocket === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

type NeonDb = ReturnType<typeof drizzleNeon<typeof schema>>;
type PgDb = ReturnType<typeof drizzlePg<typeof schema>>;
type Db = NeonDb | PgDb;

// Lazy initialization — connection is created on first database access.
// Safe for Vercel cold starts: import succeeds even if DATABASE_URL is absent.
let _db: Db | undefined;
let _pool: Pool | undefined;
let _pgClient: ReturnType<typeof postgres> | undefined;

function getDb(): Db {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL environment variable is not set');

  if (isNeonUrl(url)) {
    // Neon serverless path — uses HTTP/WebSocket, no TCP connection overhead.
    // One Pool per function instance; Neon's pooler handles the rest.
    _pool = new Pool({ connectionString: url });
    _db = drizzleNeon(_pool, { schema });
  } else {
    // Standard PostgreSQL (local dev, Supabase direct, Railway, etc.)
    const max = process.env.VERCEL ? 1 : 10;
    _pgClient = postgres(url, { max, idle_timeout: 20, connect_timeout: 10 });
    _db = drizzlePg(_pgClient, { schema });
  }
  return _db;
}

// Proxy forwards all property accesses to the lazily-created Drizzle instance.
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

// Neon hostnames contain 'neon.tech'; Supabase and local do not.
function isNeonUrl(url: string): boolean {
  return url.includes('neon.tech');
}
