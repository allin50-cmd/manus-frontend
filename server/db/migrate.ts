import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Resolve deterministically: server/db/migrate.ts → ../../drizzle (project root)
const migrationsFolder = path.resolve(__dirname, '../../drizzle');

// Migrations must use DIRECT_URL (bypasses Neon/Supabase connection pooler).
const migrationUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!migrationUrl) {
  console.error('Set DIRECT_URL (preferred) or DATABASE_URL before running migrations');
  process.exit(1);
}

async function runMigration() {
  console.log(`Running brand-suite migration from: ${migrationsFolder}`);
  const migrationClient = postgres(migrationUrl!, { max: 1 });
  const db = drizzle(migrationClient);

  try {
    await migrate(db, { migrationsFolder, migrationsTable: 'brand_suite_migrations' });
    console.log('Brand-suite migration completed');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await migrationClient.end();
  }
}

runMigration();
