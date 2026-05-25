import type { Config } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config();

// DATABASE_URL is required for migrate operations but not for generate.
// Use a placeholder so `db:generate:clerkos` works in environments without a database.
const connectionString = process.env.DATABASE_URL ?? 'postgres://placeholder/placeholder';

export default {
  schema: './server/drizzle/schema.ts',
  out: './server/drizzle/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString,
  },
  verbose: true,
  strict: true,
} satisfies Config;
