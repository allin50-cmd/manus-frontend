import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL;

let _client: ReturnType<typeof postgres> | null = null;

if (databaseUrl) {
  _client = postgres(databaseUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    connection: { statement_timeout: 30_000 },   // 30s — kills runaway queries
  });
} else {
  console.warn(
    '[DB] DATABASE_URL not set — server starting in demo mode. ClerkOS tRPC routes use in-memory mock data.',
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = (_client ? drizzle(_client, { schema }) : null) as ReturnType<typeof drizzle<typeof schema>>;

// Export schema for use in queries
export { schema };

export async function checkDatabaseConnection(): Promise<boolean> {
  if (!_client) return false;
  try {
    await _client`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
