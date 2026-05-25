import type { Config } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config();

// Drizzle Kit push/migrate must use DIRECT_URL (non-pooler).
// Falls back to DATABASE_URL for local dev / generate-only environments.
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? 'postgres://placeholder/placeholder';

export default {
  schema: './server/drizzle/schema.ts',
  out: './server/drizzle/migrations',
  driver: 'pg',
  dbCredentials: { connectionString },
  verbose: true,
  strict: true,
} satisfies Config;
