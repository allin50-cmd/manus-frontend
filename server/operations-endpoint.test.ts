/**
 * End-to-end tests for the Operations Control Plane endpoints.
 *
 * GET /api/internal/operations/overrides
 * POST /api/internal/operations/override
 * DELETE /api/internal/operations/override/:id
 * POST /api/internal/operations/annotate
 * GET /api/internal/operations/incidents
 *
 * Uses the real Express app via Node's http server.
 * DB calls are mocked so tests stay offline and deterministic.
 */
import { vi } from 'vitest';

// Mutable mocks must be hoisted so vi.mock factory can reference them
const { getDbMock, writeAuditEventMock } = vi.hoisted(() => ({
  getDbMock: vi.fn().mockResolvedValue(null),
  writeAuditEventMock: vi.fn().mockResolvedValue(undefined),
}));

vi.hoisted(() => {
  process.env.ADMIN_API_KEY = 'test-admin-key';
  process.env.COMPANIES_HOUSE_API_KEY = 'placeholder';
});

// Mock DB to avoid requiring a live PostgreSQL connection
vi.mock('./trpc/db', () => ({
  getDb: getDbMock,
  writeAuditEvent: writeAuditEventMock,
  getTenantBySlug: vi.fn().mockResolvedValue(null),
  getUserByOpenId: vi.fn().mockResolvedValue(null),
  setTenantContext: vi.fn().mockResolvedValue(undefined),
}));

import http from 'http';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createApp } from './app';
import { __resetOverrideCacheForTests } from './lib/override-engine';

let server: http.Server;
let baseUrl: string;

beforeAll(async () => {
  const app = createApp();
  server = http.createServer(app);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address();
  if (!addr || typeof addr === 'string') throw new Error('failed to bind');
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

afterAll(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
});

beforeEach(() => {
  // Reset to DB-unavailable by default (original behaviour for most tests)
  getDbMock.mockResolvedValue(null);
  writeAuditEventMock.mockResolvedValue(undefined);
  writeAuditEventMock.mockClear();
  __resetOverrideCacheForTests();
});

const adminHeaders = { 'x-admin-key': 'test-admin-key', 'content-type': 'application/json' };

describe('Operations control plane: authentication', () => {
  it('GET /api/internal/operations/overrides returns 401 without admin key', async () => {
    const res = await fetch(`${baseUrl}/api/internal/operations/overrides`);
    expect(res.status).toBe(401);
  });

  it('POST /api/internal/operations/override returns 401 without admin key', async () => {
    const res = await fetch(`${baseUrl}/api/internal/operations/override`, { method: 'POST' });
    expect(res.status).toBe(401);
  });

  it('DELETE /api/internal/operations/override/:id returns 401 without admin key', async () => {
    const res = await fetch(`${baseUrl}/api/internal/operations/override/some-id`, { method: 'DELETE' });
    expect(res.status).toBe(401);
  });

  it('POST /api/internal/operations/annotate returns 401 without admin key', async () => {
    const res = await fetch(`${baseUrl}/api/internal/operations/annotate`, { method: 'POST' });
    expect(res.status).toBe(401);
  });

  it('GET /api/internal/operations/incidents returns 401 without admin key', async () => {
    const res = await fetch(`${baseUrl}/api/internal/operations/incidents`);
    expect(res.status).toBe(401);
  });
});

describe('Operations control plane: validation', () => {
  it('POST override returns 400 when required fields missing', async () => {
    const res = await fetch(`${baseUrl}/api/internal/operations/override`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ target: 'dep', overrideType: 'force_open' }),
    });
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/required/i);
  });

  it('POST override returns 400 for unknown overrideType', async () => {
    const res = await fetch(`${baseUrl}/api/internal/operations/override`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        target: 'dep',
        overrideType: 'unknown_type',
        createdBy: 'ops',
        reason: 'test',
      }),
    });
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/overrideType/i);
  });

  it('POST override returns 400 for maintenance_mode on unknown dependency', async () => {
    const res = await fetch(`${baseUrl}/api/internal/operations/override`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        target: 'random_unknown_dep',
        overrideType: 'maintenance_mode',
        createdBy: 'ops',
        reason: 'testing unknown dep guard',
      }),
    });
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/maintenance_mode/i);
  });

  it('POST annotate returns 400 when note missing', async () => {
    const res = await fetch(`${baseUrl}/api/internal/operations/annotate`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ incidentStatus: 'degraded', createdBy: 'ops' }),
    });
    expect(res.status).toBe(400);
  });
});

describe('Operations control plane: DB unavailable returns 503', () => {
  it('GET overrides returns 503 when DB unavailable', async () => {
    const res = await fetch(`${baseUrl}/api/internal/operations/overrides`, {
      headers: { 'x-admin-key': 'test-admin-key' },
    });
    expect(res.status).toBe(503);
  });

  it('GET incidents returns 503 when DB unavailable', async () => {
    const res = await fetch(`${baseUrl}/api/internal/operations/incidents`, {
      headers: { 'x-admin-key': 'test-admin-key' },
    });
    expect(res.status).toBe(503);
  });

  it('POST override returns 503 when DB unavailable', async () => {
    const res = await fetch(`${baseUrl}/api/internal/operations/override`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        target: 'companies_house_api',
        overrideType: 'force_open',
        createdBy: 'ops',
        reason: 'test',
      }),
    });
    expect(res.status).toBe(503);
  });
});

// ─── Helper: build a minimal mock DB that supports override endpoints ─────────

function buildMockDb(opts: {
  existingRows?: Record<string, unknown>[];
  insertedRow?: Record<string, unknown>;
}) {
  const { existingRows = [], insertedRow = null } = opts;

  // The actual queries in app.ts are:
  //   await clerkDb.select().from(table).where(cond)         → array
  //   await clerkDb.select().from(table).where(cond).limit(n) → array
  //   await clerkDb.select().from(table).orderBy(col)        → array

  // Build a thenable chain so every terminal call resolves to existingRows
  const makeSelectEnd = () => {
    const end: Record<string, unknown> = {};
    // Make the object itself a thenable (Promise-like)
    end.then = (resolve: (v: unknown[]) => void, _reject: unknown) => {
      resolve(existingRows);
      return end;
    };
    end.catch = (_fn: unknown) => end;
    end.finally = (_fn: unknown) => end;
    end.limit = vi.fn().mockResolvedValue(existingRows);
    end.orderBy = vi.fn().mockResolvedValue(existingRows);
    return end;
  };

  const fromChain = {
    where: vi.fn().mockImplementation(() => makeSelectEnd()),
    orderBy: vi.fn().mockResolvedValue(existingRows),
    limit: vi.fn().mockResolvedValue(existingRows),
  };

  const selectChain = {
    from: vi.fn().mockReturnValue(fromChain),
  };

  const insertChain = {
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(insertedRow ? [insertedRow] : []),
  };

  const updateChain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
  };

  return {
    select: vi.fn().mockReturnValue(selectChain),
    insert: vi.fn().mockReturnValue(insertChain),
    update: vi.fn().mockReturnValue(updateChain),
  };
}

describe('Operations control plane: contradictory override validation', () => {
  it('POST override returns 400 when force_open conflicts with existing force_closed on same target', async () => {
    // DB returns an existing force_closed override for the same target
    const existingForceClosed = {
      id: 'existing-uuid',
      target: 'companies_house_api',
      overrideType: 'force_closed',
      value: {},
      expiresAt: null,
      createdAt: new Date().toISOString(),
      createdBy: 'ops',
      reason: 'circuit closed',
    };

    const mockDb = buildMockDb({ existingRows: [existingForceClosed] });
    getDbMock.mockResolvedValue(mockDb);

    const res = await fetch(`${baseUrl}/api/internal/operations/override`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        target: 'companies_house_api',
        overrideType: 'force_open',
        createdBy: 'ops@example.com',
        reason: 'trying to open',
      }),
    });
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/contradictory|conflict/i);
  });

  it('POST override returns 400 when force_closed conflicts with existing force_open on same target', async () => {
    const existingForceOpen = {
      id: 'existing-uuid-2',
      target: 'stripe_api',
      overrideType: 'force_open',
      value: {},
      expiresAt: null,
      createdAt: new Date().toISOString(),
      createdBy: 'ops',
      reason: 'circuit open',
    };

    const mockDb = buildMockDb({ existingRows: [existingForceOpen] });
    getDbMock.mockResolvedValue(mockDb);

    const res = await fetch(`${baseUrl}/api/internal/operations/override`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        target: 'stripe_api',
        overrideType: 'force_closed',
        createdBy: 'ops@example.com',
        reason: 'trying to close',
      }),
    });
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/contradictory|conflict/i);
  });
});

describe('Operations control plane: expiry filtering', () => {
  it('GET /overrides only returns non-expired overrides', async () => {
    const pastDate = new Date(Date.now() - 60_000).toISOString(); // 1 minute ago
    const futureDate = new Date(Date.now() + 3_600_000).toISOString(); // 1 hour from now

    const activeOverride = {
      id: 'active-uuid',
      target: 'companies_house_api',
      overrideType: 'force_open',
      value: {},
      expiresAt: futureDate,
      createdAt: new Date().toISOString(),
      createdBy: 'ops',
      reason: 'active override',
    };

    // The mock DB simulates only non-expired rows being returned
    // (the actual filtering is done via the WHERE clause in the query)
    const mockDb = buildMockDb({ existingRows: [activeOverride] });
    getDbMock.mockResolvedValue(mockDb);

    const res = await fetch(`${baseUrl}/api/internal/operations/overrides`, {
      headers: { 'x-admin-key': 'test-admin-key' },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { overrides: unknown[] };
    expect(body.overrides).toHaveLength(1);
    expect((body.overrides[0] as { id: string }).id).toBe('active-uuid');
  });
});

describe('Operations control plane: audit events', () => {
  it('POST override emits system_override_applied audit event', async () => {
    const createdOverride = {
      id: 'audit-test-uuid',
      target: 'companies_house_api',
      overrideType: 'force_open',
      value: {},
      expiresAt: null,
      createdAt: new Date().toISOString(),
      createdBy: 'ops@example.com',
      reason: 'audit test',
    };

    const mockDb = buildMockDb({ existingRows: [], insertedRow: createdOverride });
    getDbMock.mockResolvedValue(mockDb);

    const res = await fetch(`${baseUrl}/api/internal/operations/override`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        target: 'companies_house_api',
        overrideType: 'force_open',
        createdBy: 'ops@example.com',
        reason: 'audit test',
      }),
    });
    expect(res.status).toBe(201);

    // Audit event must have been written
    expect(writeAuditEventMock).toHaveBeenCalled();
    const auditCall = writeAuditEventMock.mock.calls[0][0];
    expect(auditCall.action).toBe('system_override_applied');
    expect(auditCall.entityType).toBe('system');
    const meta = JSON.parse(auditCall.metadata);
    expect(meta.target).toBe('companies_house_api');
    expect(meta.overrideType).toBe('force_open');
    expect(meta.createdBy).toBe('ops@example.com');
  });

  it('POST annotate emits system_annotation_added audit event', async () => {
    const createdAnnotation = {
      id: 'annot-uuid',
      incidentStatus: 'open',
      note: 'Cloudflare outage suspected',
      createdAt: new Date().toISOString(),
      createdBy: 'ops@example.com',
    };

    const mockDb = buildMockDb({ existingRows: [], insertedRow: createdAnnotation });
    getDbMock.mockResolvedValue(mockDb);

    const res = await fetch(`${baseUrl}/api/internal/operations/annotate`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        note: 'Cloudflare outage suspected',
        incidentStatus: 'open',
        createdBy: 'ops@example.com',
      }),
    });
    expect(res.status).toBe(201);

    expect(writeAuditEventMock).toHaveBeenCalled();
    const auditCall = writeAuditEventMock.mock.calls[0][0];
    expect(auditCall.action).toBe('system_annotation_added');
    expect(auditCall.entityType).toBe('system');
    const meta = JSON.parse(auditCall.metadata);
    expect(meta.incidentStatus).toBe('open');
    expect(meta.createdBy).toBe('ops@example.com');
  });

  it('DELETE override emits system_override_removed audit event', async () => {
    const existingOverride = {
      id: 'del-uuid',
      target: 'stripe_api',
      overrideType: 'force_closed',
      value: {},
      expiresAt: null,
      createdAt: new Date().toISOString(),
      createdBy: 'ops',
      reason: 'to be deleted',
    };

    const mockDb = buildMockDb({ existingRows: [existingOverride] });
    getDbMock.mockResolvedValue(mockDb);

    const res = await fetch(`${baseUrl}/api/internal/operations/override/del-uuid`, {
      method: 'DELETE',
      headers: { 'x-admin-key': 'test-admin-key' },
    });
    expect(res.status).toBe(200);

    expect(writeAuditEventMock).toHaveBeenCalled();
    const auditCall = writeAuditEventMock.mock.calls[0][0];
    expect(auditCall.action).toBe('system_override_removed');
    expect(auditCall.entityType).toBe('system');
  });
});
