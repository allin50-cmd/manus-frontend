import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  evaluateOperationalOverride,
  getAllActiveOverrides,
  invalidateOverrideCache,
  __resetOverrideCacheForTests,
} from './override-engine';

// Mutable getDb mock — must be hoisted so vi.mock factory can reference it
const { getDbMock } = vi.hoisted(() => ({
  getDbMock: vi.fn().mockResolvedValue(null),
}));

vi.mock('../trpc/db', () => ({
  getDb: getDbMock,
  writeAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  __resetOverrideCacheForTests();
  // Default: DB unavailable
  getDbMock.mockResolvedValue(null);
});

describe('override-engine: DB unavailable (graceful degradation)', () => {
  it('returns inactive override when DB unavailable', async () => {
    const result = await evaluateOperationalOverride('companies_house_api', 'force_open');
    expect(result.active).toBe(false);
    expect(result.overrideType).toBeNull();
  });

  it('returns empty overrides map when DB unavailable', async () => {
    const overrides = await getAllActiveOverrides();
    expect(overrides).toEqual({});
  });

  it('does not throw when DB unavailable', async () => {
    await expect(
      evaluateOperationalOverride('any_target', 'maintenance_mode'),
    ).resolves.not.toThrow();
  });
});

describe('override-engine: cache invalidation', () => {
  it('invalidateOverrideCache() resets cache without throwing', () => {
    expect(() => invalidateOverrideCache()).not.toThrow();
  });
});

describe('override-engine: stale cache fallback on DB error', () => {
  it('serves last known-good cache when DB query throws after a successful load', async () => {
    // Simulate a DB that successfully returned an override on first call
    const mockRow = {
      id: 'test-uuid-1',
      target: 'companies_house_api',
      overrideType: 'force_open',
      value: {},
      expiresAt: null,
      createdAt: new Date(),
      createdBy: 'ops@example.com',
      reason: 'stale cache test',
    };

    const selectChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockRow]),
    };
    const mockDbSuccess = {
      select: vi.fn().mockReturnValue(selectChain),
    };

    // First call: DB available, loads override into lastValidCache
    getDbMock.mockResolvedValueOnce(mockDbSuccess);
    const result1 = await evaluateOperationalOverride('companies_house_api', 'force_open');
    expect(result1.active).toBe(true);
    expect(result1.overrideType).toBe('force_open');

    // Invalidate so next call re-queries DB
    invalidateOverrideCache();

    // Second call: DB throws — should fall back to lastValidCache
    const mockDbError = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockRejectedValue(new Error('DB connection lost')),
      }),
    };
    getDbMock.mockResolvedValueOnce(mockDbError);

    const result2 = await evaluateOperationalOverride('companies_house_api', 'force_open');
    // Must serve stale cache — not empty
    expect(result2.active).toBe(true);
    expect(result2.overrideType).toBe('force_open');
  });

  it('returns inactive (empty map) when DB never loaded and cache is empty', async () => {
    // DB unavailable from the start, lastValidCache is empty
    getDbMock.mockResolvedValue(null);
    const result = await evaluateOperationalOverride('companies_house_api', 'force_open');
    expect(result.active).toBe(false);
  });
});
