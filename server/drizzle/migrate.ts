import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

// Migrations must use DIRECT_URL (bypasses Neon/Supabase connection pooler).
// Pooler connections drop transaction state that DDL migrations depend on.
// DIRECT_URL = your non-pooler connection string.
// If not set, falls back to DATABASE_URL (safe for local dev and Railway).
const migrationUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!migrationUrl) {
  console.error('Set DIRECT_URL (preferred) or DATABASE_URL before running migrations');
  process.exit(1);
}

async function runMigration() {
  console.log('Running ClerkOS schema migration...');
  const client = postgres(migrationUrl!, { max: 1 });
  const db = drizzle(client);

  try {
    await migrate(db, { migrationsFolder: './server/drizzle/migrations' });
    console.log('ClerkOS migration completed');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
