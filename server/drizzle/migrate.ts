import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function runMigration() {
  console.log('Running ClerkOS schema migration...');
  const client = postgres(databaseUrl!, { max: 1 });
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
