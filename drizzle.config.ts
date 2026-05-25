import type { Config } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config();

// Drizzle Kit push/migrate must use DIRECT_URL (non-pooler).
// Falls back to DATABASE_URL for local dev where there is no pooler.
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Set DIRECT_URL (preferred) or DATABASE_URL for Drizzle Kit');
}

export default {
  schema: './server/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: { connectionString },
  verbose: true,
  strict: true,
} satisfies Config;
