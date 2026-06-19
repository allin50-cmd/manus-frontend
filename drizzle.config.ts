import type { Config } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.DATABASE_URL ?? 'postgres://placeholder/placeholder';

export default {
  schema: './db/schema.ts',
  out: './db/migrations',
  driver: 'pg',
  dbCredentials: { connectionString: url },
  verbose: true,
  strict: true,
} satisfies Config;
