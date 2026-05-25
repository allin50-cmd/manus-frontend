import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import { tenants } from './schema';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// UUIDs are stable constants — do not change them across environments.
const SYSTEM_TENANT_ID = '00000000-0000-0000-0000-000000000001';

async function seed() {
  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client);

  try {
    console.log('Seeding ClerkOS system tenant...');

    await db
      .insert(tenants)
      .values({
        id: SYSTEM_TENANT_ID,
        name: 'UltraCore System',
        slug: 'system',
        plan: 'enterprise',
      })
      .onConflictDoNothing();

    console.log(`System tenant ready: ${SYSTEM_TENANT_ID}`);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
