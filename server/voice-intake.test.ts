/**
 * Tests for POST /api/voice/intake
 *
 * Covers all 7 acceptance criteria:
 *   1. Required-field validation (400 on missing fields)
 *   2. Invalid payload → safe 400 with details
 *   3. Duplicate provider_call_id is idempotent (200 duplicate)
 *   4. Valid call creates exactly one alert
 *   5. Every accepted call writes an audit event
 *   6. HIGH and CRITICAL calls → humanReviewRequired = true
 *   7. LOW and MEDIUM calls → humanReviewRequired = false
 */
import { vi } from 'vitest';

// ─── Hoisted env + mocks ──────────────────────────────────────────────────────

vi.hoisted(() => {
  process.env.ADMIN_API_KEY = 'test-admin-key';
  process.env.DATABASE_URL = 'postgresql://mock-test';
});

let _alertRows: Array<{ id: string }> = [];
let _alertShouldThrow = false;
let _updateRows: unknown[] = [];

const { writeAuditEventMock } = vi.hoisted(() => ({
  writeAuditEventMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./db/index', () => ({
  db: {
    insert: () => ({
      values: () => ({
        onConflictDoNothing: () => ({
          returning: async () => {
            if (_alertShouldThrow) throw new Error('DB down');
            return _alertRows;
          },
        }),
      }),
    }),
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () => [],
        }),
        orderBy: async () => [],
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

vi.mock('./trpc/db', () => ({
  getDb: vi.fn().mockResolvedValue(null),
  writeAuditEvent: writeAuditEventMock,
  getTenantBySlug: vi.fn().mockResolvedValue(null),
  getUserByOpenId: vi.fn().mockResolvedValue(null),
  setTenantContext: vi.fn().mockResolvedValue(undefined),
}));

// ─── Server setup ─────────────────────────────────────────────────────────────

import http from 'http';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createApp } from './app';

let server: http.Server;
let baseUrl: string;

beforeAll(async () => {
  const app = createApp();
  server = http.createServer(app);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address();
  if (!addr || typeof addr === 'string') throw new Error('Failed to bind');
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

afterAll(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
});

beforeEach(() => {
  _alertRows = [{ id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' }];
  _alertShouldThrow = false;
  _updateRows = [];
  writeAuditEventMock.mockClear();
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const VALID_PAYLOAD = {
  provider_call_id: 'call_test_001',
  caller_name: 'Jane Smith',
  phone_number: '+44 7700 900000',
  company_name: 'Acme Ltd',
  caller_role: 'Director',
  reason_for_call: 'General enquiry about compliance services',
};

const post = (body: unknown) =>
  fetch(`${baseUrl}/api/voice/intake`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

// ─── AC1 + AC2: Payload validation ───────────────────────────────────────────

describe('POST /api/voice/intake — validation', () => {
  it('returns 400 when provider_call_id is missing', async () => {
    const { provider_call_id: _, ...body } = VALID_PAYLOAD;
    const res = await post(body);
    expect(res.status).toBe(400);
    const json = await res.json() as { ok: boolean; error: string; details: string[] };
    expect(json.ok).toBe(false);
    expect(json.error).toBe('Invalid payload');
    expect(json.details.some((d: string) => d.includes('provider_call_id'))).toBe(true);
  });

  it('returns 400 when caller_name is missing', async () => {
    const { caller_name: _, ...body } = VALID_PAYLOAD;
    const res = await post(body);
    expect(res.status).toBe(400);
  });

  it('returns 400 when company_name is missing', async () => {
    const { company_name: _, ...body } = VALID_PAYLOAD;
    const res = await post(body);
    expect(res.status).toBe(400);
  });

  it('returns 400 when reason_for_call is missing', async () => {
    const { reason_for_call: _, ...body } = VALID_PAYLOAD;
    const res = await post(body);
    expect(res.status).toBe(400);
  });

  it('returns 400 for completely empty body', async () => {
    const res = await post({});
    expect(res.status).toBe(400);
    const json = await res.json() as { ok: boolean };
    expect(json.ok).toBe(false);
  });

  it('returns 400 for non-object body (array)', async () => {
    const res = await post([]);
    expect(res.status).toBe(400);
  });
});

// ─── AC3: Idempotency ─────────────────────────────────────────────────────────

describe('POST /api/voice/intake — duplicate replay (AC3)', () => {
  it('returns 200 with action=duplicate when provider_call_id already processed', async () => {
    // Simulate onConflictDoNothing returning 0 rows (existing row found)
    _alertRows = [];
    const res = await post(VALID_PAYLOAD);
    expect(res.status).toBe(200);
    const json = await res.json() as { ok: boolean; action: string; message: string };
    expect(json.ok).toBe(true);
    expect(json.action).toBe('duplicate');
    expect(json.message).toContain('cannot provide legal or accounting advice');
  });

  it('does NOT write an audit event for a duplicate replay', async () => {
    _alertRows = [];
    await post(VALID_PAYLOAD);
    expect(writeAuditEventMock).not.toHaveBeenCalled();
  });
});

// ─── AC4: Creates exactly one alert ──────────────────────────────────────────

describe('POST /api/voice/intake — alert creation (AC4)', () => {
  it('returns 201 with alertId for a valid new call', async () => {
    const res = await post(VALID_PAYLOAD);
    expect(res.status).toBe(201);
    const json = await res.json() as { ok: boolean; action: string; alertId: string };
    expect(json.ok).toBe(true);
    expect(json.action).toBe('created');
    expect(json.alertId).toBe('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
  });

  it('returns 500 when DB fails (failedSafe — no crash)', async () => {
    _alertShouldThrow = true;
    const res = await post(VALID_PAYLOAD);
    expect(res.status).toBe(500);
    const json = await res.json() as { ok: boolean };
    expect(json.ok).toBe(false);
  });
});

// ─── AC5: Audit event written ─────────────────────────────────────────────────

describe('POST /api/voice/intake — audit event (AC5)', () => {
  it('writes exactly one audit event for a new call', async () => {
    await post(VALID_PAYLOAD);
    expect(writeAuditEventMock).toHaveBeenCalledOnce();
  });

  it('audit event has action=voice_intake_received and entityType=voice_intake', async () => {
    await post(VALID_PAYLOAD);
    const call = writeAuditEventMock.mock.calls[0][0] as { action: string; entityType: string };
    expect(call.action).toBe('voice_intake_received');
    expect(call.entityType).toBe('voice_intake');
  });
});

// ─── AC6 + AC7: Risk classification ──────────────────────────────────────────

describe('POST /api/voice/intake — risk classification (AC6, AC7)', () => {
  it('HIGH — humanReviewRequired=true for overdue filing', async () => {
    const res = await post({ ...VALID_PAYLOAD, reason_for_call: 'There are overdue filing obligations' });
    expect(res.status).toBe(201);
    const json = await res.json() as { urgency: string; humanReviewRequired: boolean };
    expect(json.urgency).toBe('HIGH');
    expect(json.humanReviewRequired).toBe(true);
  });

  it('CRITICAL — humanReviewRequired=true for dissolution', async () => {
    const res = await post({ ...VALID_PAYLOAD, reason_for_call: 'The company is facing dissolution proceedings' });
    expect(res.status).toBe(201);
    const json = await res.json() as { urgency: string; humanReviewRequired: boolean };
    expect(json.urgency).toBe('CRITICAL');
    expect(json.humanReviewRequired).toBe(true);
  });

  it('MEDIUM — humanReviewRequired=false', async () => {
    const res = await post({ ...VALID_PAYLOAD, reason_for_call: 'I am unsure about the upcoming filing' });
    expect(res.status).toBe(201);
    const json = await res.json() as { urgency: string; humanReviewRequired: boolean };
    expect(json.urgency).toBe('MEDIUM');
    expect(json.humanReviewRequired).toBe(false);
  });

  it('LOW — humanReviewRequired=false', async () => {
    const res = await post(VALID_PAYLOAD);
    expect(res.status).toBe(201);
    const json = await res.json() as { urgency: string; humanReviewRequired: boolean };
    expect(json.urgency).toBe('LOW');
    expect(json.humanReviewRequired).toBe(false);
  });

  it('response always includes safety wording', async () => {
    const res = await post(VALID_PAYLOAD);
    const json = await res.json() as { message: string };
    expect(json.message).toContain('cannot provide legal or accounting advice');
  });
});

// ─── Optional fields ──────────────────────────────────────────────────────────

describe('POST /api/voice/intake — optional fields', () => {
  it('accepts call with all optional fields populated', async () => {
    const res = await post({
      ...VALID_PAYLOAD,
      deadline_date: '15/07/2026',
      companies_house_number: '12345678',
      transcript: 'Full transcript of the call...',
      summary: 'Client wants compliance review',
      received_at: '2026-06-01T10:00:00.000Z',
    });
    expect(res.status).toBe(201);
  });

  it('accepts call with null optional fields', async () => {
    const res = await post({
      ...VALID_PAYLOAD,
      deadline_date: null,
      companies_house_number: null,
      transcript: null,
      summary: null,
    });
    expect(res.status).toBe(201);
  });
});

// ─── Webhook secret guard ─────────────────────────────────────────────────────

describe('POST /api/voice/intake — webhook secret (when VOICE_WEBHOOK_SECRET set)', () => {
  it('returns 401 when secret is wrong', async () => {
    process.env.VOICE_WEBHOOK_SECRET = 'correct-secret';
    const res = await fetch(`${baseUrl}/api/voice/intake`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'authorization': 'Bearer wrong-secret' },
      body: JSON.stringify(VALID_PAYLOAD),
    });
    expect(res.status).toBe(401);
    delete process.env.VOICE_WEBHOOK_SECRET;
  });

  it('returns 201 when secret is correct', async () => {
    process.env.VOICE_WEBHOOK_SECRET = 'correct-secret';
    const res = await fetch(`${baseUrl}/api/voice/intake`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'authorization': 'Bearer correct-secret' },
      body: JSON.stringify(VALID_PAYLOAD),
    });
    expect(res.status).toBe(201);
    delete process.env.VOICE_WEBHOOK_SECRET;
  });
});
