import dotenv from 'dotenv';
dotenv.config();

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('[db] WARNING: DATABASE_URL is not set — DB queries will fail at runtime');
}

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Create postgres connection – tuned for Azure App Service
// Falls back to a placeholder URL so the process can start even without DB configured;
// all queries will fail gracefully at runtime.
const client = postgres(databaseUrl ?? 'postgres://localhost/placeholder', {
  max: IS_PRODUCTION ? 20 : 10,        // Azure B1+ can handle 20 connections
  idle_timeout: IS_PRODUCTION ? 30 : 20, // Keep connections warm longer in prod
  connect_timeout: 15,                    // Azure PG can be slow on cold start
  ssl: IS_PRODUCTION ? { rejectUnauthorized: false } : undefined, // Azure requires SSL
});

// Create drizzle instance
export const db = drizzle(client, { schema });

// Export schema for use in queries
export { schema };

// Health check function
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await client`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
