// Temporal system DB client — separate instance from src/server/db
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL ?? '';

const dbClient = databaseUrl
  ? postgres(databaseUrl, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      max_lifetime: 1800,
    })
  : postgres('postgres://localhost/placeholder', {
      max: 1,
      connect_timeout: 1,
    });

export { dbClient };

export const db = drizzle(dbClient, { schema });
