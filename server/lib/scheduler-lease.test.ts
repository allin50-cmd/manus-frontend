import { describe, it, expect, beforeEach, vi } from 'vitest';

// Must declare mock before any imports that use the module
vi.mock('../trpc/db', () => ({
  getDb: vi.fn(),
  writeAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

import { acquireSchedulerLease, getSchedulerLeaseState } from './scheduler-lease';
import { getDb } from '../trpc/db';

function makeDb(rows: Array<{ leaseName: string; holderInstance: string; acquiredAt: Date; expiresAt: Date }>) {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(rows),
        }),
      }),
    }),
    insert: () => ({
      values: () => ({
        onConflictDoUpdate: () => Promise.resolve(undefined),
      }),
    }),
    delete: () => ({
      where: () => Promise.resolve(undefined),
    }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('scheduler-lease: acquisition', () => {
  it('acquires lease when no existing row', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(getDb).mockResolvedValue(makeDb([]) as any);
    const result = await acquireSchedulerLease('test-lease', 60_000);
    expect(result.acquired).toBe(true);
  });

  it('acquires lease when existing row is expired', async () => {
    const rows = [
      {
        leaseName: 'test-lease',
        holderInstance: 'other-instance',
        acquiredAt: new Date(Date.now() - 120_000),
        expiresAt: new Date(Date.now() - 60_000), // expired
      },
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(getDb).mockResolvedValue(makeDb(rows) as any);
    const result = await acquireSchedulerLease('test-lease', 60_000);
    expect(result.acquired).toBe(true);
  });

  it('skips execution when lease held by another instance', async () => {
    const rows = [
      {
        leaseName: 'test-lease',
        holderInstance: 'other-instance-id',
        acquiredAt: new Date(Date.now() - 30_000),
        expiresAt: new Date(Date.now() + 30_000), // active
      },
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(getDb).mockResolvedValue(makeDb(rows) as any);
    const result = await acquireSchedulerLease('test-lease', 60_000);
    expect(result.acquired).toBe(false);
    expect(result.holderInstance).toBe('other-instance-id');
  });
});

describe('scheduler-lease: DB unavailable fallback', () => {
  it('allows execution when DB is unavailable (prevents starvation)', async () => {
    vi.mocked(getDb).mockResolvedValue(null);
    const result = await acquireSchedulerLease('test-lease', 60_000);
    expect(result.acquired).toBe(true);
  });
});

describe('scheduler-lease: observability', () => {
  it('reports held=false when no row exists', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(getDb).mockResolvedValue(makeDb([]) as any);
    const state = await getSchedulerLeaseState('test-lease');
    expect(state.held).toBe(false);
    expect(state.holderInstance).toBeNull();
  });

  it('reports held=true with unexpired lease', async () => {
    const rows = [
      {
        leaseName: 'test-lease',
        holderInstance: 'instance-abc',
        acquiredAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
      },
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(getDb).mockResolvedValue(makeDb(rows) as any);
    const state = await getSchedulerLeaseState('test-lease');
    expect(state.held).toBe(true);
    expect(state.holderInstance).toBe('instance-abc');
  });

  it('reports held=false when lease is expired', async () => {
    const rows = [
      {
        leaseName: 'test-lease',
        holderInstance: 'instance-abc',
        acquiredAt: new Date(Date.now() - 120_000),
        expiresAt: new Date(Date.now() - 60_000), // expired
      },
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(getDb).mockResolvedValue(makeDb(rows) as any);
    const state = await getSchedulerLeaseState('test-lease');
    expect(state.held).toBe(false);
  });
});
