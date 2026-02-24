/**
 * Vitest global test setup
 * Sets up environment variables needed for unit tests.
 */
import { vi } from 'vitest';

// Set required env vars for unit tests (no real DB needed)
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.LOCAL_ENCRYPTION_KEY = '0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20';
process.env.HMRC_ENVIRONMENT = 'sandbox';
process.env.NODE_ENV = 'test';

// Mock Drizzle DB for unit tests — real DB is only used in integration tests
vi.mock('../server/db/index', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
          orderBy: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }),
        }),
        orderBy: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }),
        limit: vi.fn().mockResolvedValue([]),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'mock-id' }]),
        onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  },
  schema: {},
}));
