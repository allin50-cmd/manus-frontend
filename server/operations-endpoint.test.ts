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

vi.hoisted(() => {
  process.env.ADMIN_API_KEY = 'test-admin-key';
  process.env.COMPANIES_HOUSE_API_KEY = 'placeholder';
});

// Mock DB to avoid requiring a live PostgreSQL connection
vi.mock('./trpc/db', () => ({
  getDb: vi.fn().mockResolvedValue(null), // returns null → 503 responses from DB-required routes
  writeAuditEvent: vi.fn().mockResolvedValue(undefined),
  getTenantBySlug: vi.fn().mockResolvedValue(null),
  getUserByOpenId: vi.fn().mockResolvedValue(null),
  setTenantContext: vi.fn().mockResolvedValue(undefined),
}));

import http from 'http';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from './app';

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
