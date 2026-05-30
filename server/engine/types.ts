import type { drizzle } from 'drizzle-orm/postgres-js';

export type DrizzleDb = ReturnType<typeof drizzle>;
