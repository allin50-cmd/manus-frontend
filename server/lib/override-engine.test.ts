import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  evaluateOperationalOverride,
  getAllActiveOverrides,
  invalidateOverrideCache,
  __resetOverrideCacheForTests,
} from './override-engine';

// Mock getDb to avoid needing a real DB in unit tests
vi.mock('../trpc/db', () => ({
  getDb: vi.fn().mockResolvedValue(null), // DB unavailable
  writeAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  __resetOverrideCacheForTests();
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
