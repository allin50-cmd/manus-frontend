// ============================================================================
// Store — Singleton
// Returns MemoryStore for dev (no DATABASE_URL), DbStore for prod.
// ============================================================================

import { FineGuardStore } from './types.js';
import { MemoryStore } from './memory.js';

let _store: FineGuardStore | null = null;

export async function getStore(): Promise<FineGuardStore> {
  if (_store) return _store;

  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl && !dbUrl.includes('your-')) {
    // Production: use PostgreSQL via Drizzle
    const { DbStore } = await import('./db.js');
    _store = new DbStore();
    console.log('🗄️  Using PostgreSQL store');
  } else {
    // Local dev: use in-memory store
    _store = new MemoryStore();
    console.log('💾 Using in-memory store (data resets on restart)');
  }

  return _store;
}

export type { FineGuardStore } from './types.js';
