import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL ?? '';

// Validation is deferred to request time; build-time import is safe
const client = databaseUrl
  ? postgres(databaseUrl, {
      max: 20,
      idle_timeout: 20,
      connect_timeout: 10,
      max_lifetime: 1800,    // recycle connections every 30 min
    })
  : postgres('postgres://localhost/placeholder', { max: 1, connect_timeout: 1 }); // fail fast — no DB configured

function assertDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
}

export { assertDatabaseUrl };

export const db = drizzle(client, { schema });
export { schema };

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await client`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
