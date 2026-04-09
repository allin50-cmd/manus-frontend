/**
 * Drizzle Kit config for the Temporal schema (src/db/schema/).
 *
 * Usage:
 *   npx drizzle-kit generate --config drizzle.config.temporal.ts
 *   npx drizzle-kit push    --config drizzle.config.temporal.ts
 *
 * Note: raw SQL migrations in db/migrations/ are the source of truth for
 * the Temporal schema in production. This config is provided for inspection
 * (db:studio) and local schema diffing only.
 */
import type { Config } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export default {
  schema: './src/db/schema/index.ts',
  out: './drizzle-temporal',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
} satisfies Config;
