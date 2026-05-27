/**
 * Tests for FineGuard alert management endpoints.
 *
 * GET  /api/internal/alerts
 * PATCH /api/internal/alerts/:id/acknowledge
 *
 * Uses the real Express app via Node's http server.
 * DB calls are mocked so tests stay offline and deterministic.
 */
import { vi } from 'vitest';

// ─── Hoisted setup ────────────────────────────────────────────────────────────

// Mutable state read by the DB mock closures on every invocation
let _selectRows: unknown[] = [];
let _updateRows: unknown[] = [];

const { writeAuditEventMock } = vi.hoisted(() => ({
  writeAuditEventMock: vi.fn().mockResolvedValue(undefined),
}));

vi.hoisted(() => {
  process.env.ADMIN_API_KEY = 'test-admin-key';
  process.env.COMPANIES_HOUSE_API_KEY = 'placeholder';
  // Prevent 503 guard — actual calls go to the mock below
  process.env.DATABASE_URL = 'postgresql://mock-test';
});

// Mock the brand-suite db (used by alerts endpoints)
vi.mock('./db/index', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () => _selectRows,
        }),
        orderBy: async () => _selectRows,
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: async () => _updateRows,
        }),
      }),
    }),
  },
}));

// Mock ClerkOS db (used by writeAuditEvent and auth helpers)
vi.mock('./trpc/db', () => ({
  getDb: vi.fn().mockResolvedValue(null),
  writeAuditEvent: writeAuditEventMock,
  getTenantBySlug: vi.fn().mockResolvedValue(null),
  getUserByOpenId: vi.fn().mockResolvedValue(null),
  setTenantContext: vi.fn().mockResolvedValue(undefined),
}));

// ─── Test fixtures ────────────────────────────────────────────────────────────

import http from 'http';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createApp } from './app';

let server: http.Server;
let baseUrl: string;

const ALERT_ROW = {
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  tenantId: '00000000-0000-0000-0000-000000000001',
  complianceRunId: '11111111-1111-1111-1111-111111111111',
  alertType: 'overdue_filings',
  severity: 'high',
  title: 'Compliance alert: Test Corp',
  message: 'Overdue filings detected',
  status: 'pending',
  metadata: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

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
  _selectRows = [ALERT_ROW];
  _updateRows = [{ ...ALERT_ROW, status: 'acknowledged' }];
  writeAuditEventMock.mockClear();
});

const adminHeaders = { 'x-admin-key': 'test-admin-key', 'content-type': 'application/json' };

// ─── GET /api/internal/alerts ─────────────────────────────────────────────────

describe('GET /api/internal/alerts', () => {
  it('returns 401 without admin key', async () => {
    const res = await fetch(`${baseUrl}/api/internal/alerts`);
    expect(res.status).toBe(401);
  });

  it('returns all alerts when no status filter provided', async () => {
    const res = await fetch(`${baseUrl}/api/internal/alerts`, { headers: adminHeaders });
    expect(res.status).toBe(200);
    const body = await res.json() as { alerts: unknown[]; total: number };
    expect(body.total).toBe(1);
    expect(body.alerts).toHaveLength(1);
  });

  it('returns filtered alerts when valid status filter is provided', async () => {
    const res = await fetch(`${baseUrl}/api/internal/alerts?status=pending`, { headers: adminHeaders });
    expect(res.status).toBe(200);
    const body = await res.json() as { alerts: unknown[]; total: number };
    expect(body.alerts).toHaveLength(1);
  });

  it('returns 400 for invalid status filter', async () => {
    const res = await fetch(`${baseUrl}/api/internal/alerts?status=invalid`, { headers: adminHeaders });
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/Invalid status filter/);
  });

  it('returns empty list when no alerts exist', async () => {
    _selectRows = [];
    const res = await fetch(`${baseUrl}/api/internal/alerts`, { headers: adminHeaders });
    expect(res.status).toBe(200);
    const body = await res.json() as { alerts: unknown[]; total: number };
    expect(body.total).toBe(0);
    expect(body.alerts).toHaveLength(0);
  });
});

// ─── PATCH /api/internal/alerts/:id/acknowledge ───────────────────────────────

describe('PATCH /api/internal/alerts/:id/acknowledge', () => {
  it('returns 401 without admin key', async () => {
    const res = await fetch(`${baseUrl}/api/internal/alerts/${ALERT_ROW.id}/acknowledge`, {
      method: 'PATCH',
    });
    expect(res.status).toBe(401);
  });

  it('returns 404 when alert does not exist', async () => {
    _updateRows = [];
    const res = await fetch(`${baseUrl}/api/internal/alerts/${ALERT_ROW.id}/acknowledge`, {
      method: 'PATCH',
      headers: adminHeaders,
    });
    expect(res.status).toBe(404);
  });

  it('returns 200 with updated alert on success', async () => {
    const res = await fetch(`${baseUrl}/api/internal/alerts/${ALERT_ROW.id}/acknowledge`, {
      method: 'PATCH',
      headers: adminHeaders,
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { ok: boolean; alert: { status: string } };
    expect(body.ok).toBe(true);
    expect(body.alert.status).toBe('acknowledged');
  });

  it('writes an audit event when an alert is acknowledged', async () => {
    await fetch(`${baseUrl}/api/internal/alerts/${ALERT_ROW.id}/acknowledge`, {
      method: 'PATCH',
      headers: adminHeaders,
    });
    expect(writeAuditEventMock).toHaveBeenCalledOnce();
    const call = writeAuditEventMock.mock.calls[0][0] as { action: string; entityType: string };
    expect(call.action).toBe('alert_acknowledged');
    expect(call.entityType).toBe('compliance_alert');
  });
});
