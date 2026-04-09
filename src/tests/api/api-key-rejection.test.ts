/**
 * API key guard tests.
 *
 * Verifies requireApiKey:
 * - Returns null (pass) when key matches MONITORING_API_KEY
 * - Returns 401 when key is wrong
 * - Returns 401 when key is absent
 * - Returns 503 when MONITORING_API_KEY env var is not set
 *
 * Also spot-checks that two protected routes reject unauthenticated requests.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { requireApiKey } from '../../lib/utils/require-api-key';

const VALID_KEY = 'test-key-abc123';

function makeReq(key?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (key !== undefined) headers['x-api-key'] = key;
  return new NextRequest('http://localhost/api/monitoring/activate', {
    method: 'POST',
    headers,
  });
}

describe('requireApiKey', () => {
  const originalKey = process.env.MONITORING_API_KEY;

  beforeEach(() => {
    process.env.MONITORING_API_KEY = VALID_KEY;
  });

  afterEach(() => {
    process.env.MONITORING_API_KEY = originalKey;
  });

  it('returns null when key matches', () => {
    const result = requireApiKey(makeReq(VALID_KEY));
    expect(result).toBeNull();
  });

  it('returns 401 when key is wrong', async () => {
    const result = requireApiKey(makeReq('wrong-key'));
    expect(result).not.toBeNull();
    expect(result!.status).toBe(401);
    const json = await result!.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 401 when x-api-key header is absent', async () => {
    const result = requireApiKey(makeReq());
    expect(result).not.toBeNull();
    expect(result!.status).toBe(401);
  });

  it('returns 503 when MONITORING_API_KEY env var is not set', async () => {
    delete process.env.MONITORING_API_KEY;
    const result = requireApiKey(makeReq(VALID_KEY));
    expect(result).not.toBeNull();
    expect(result!.status).toBe(503);
    const json = await result!.json();
    expect(json.error).toContain('MONITORING_API_KEY');
  });
});

// ── Spot-check protected route ────────────────────────────────────────────────

vi.mock('../../repositories/company.repository', () => ({
  findCompanyByNumber: vi.fn(),
  insertMonitoredCompany: vi.fn(),
  findCompanyById: vi.fn(),
}));

vi.mock('../../repositories/obligation.repository', () => ({
  insertObligation: vi.fn(),
}));

vi.mock('../../domain/services/workflow-start.service', () => ({
  startObligationWorkflow: vi.fn(),
}));

import { POST as activatePOST } from '../../app/api/monitoring/activate/route';

describe('POST /api/monitoring/activate — auth gate', () => {
  const originalKey = process.env.MONITORING_API_KEY;

  beforeEach(() => {
    process.env.MONITORING_API_KEY = VALID_KEY;
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.MONITORING_API_KEY = originalKey;
  });

  it('returns 401 with no x-api-key header', async () => {
    const req = new NextRequest('http://localhost/api/monitoring/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: '00000000-0000-0000-0000-000000000001', companyNumber: '12345678', companyName: 'Acme' }),
    });
    const res = await activatePOST(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 with wrong x-api-key', async () => {
    const req = new NextRequest('http://localhost/api/monitoring/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': 'wrong' },
      body: JSON.stringify({ tenantId: '00000000-0000-0000-0000-000000000001', companyNumber: '12345678', companyName: 'Acme' }),
    });
    const res = await activatePOST(req);
    expect(res.status).toBe(401);
  });

  it('returns 503 when MONITORING_API_KEY is not configured', async () => {
    delete process.env.MONITORING_API_KEY;
    const req = new NextRequest('http://localhost/api/monitoring/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': VALID_KEY },
      body: JSON.stringify({ tenantId: '00000000-0000-0000-0000-000000000001', companyNumber: '12345678', companyName: 'Acme' }),
    });
    const res = await activatePOST(req);
    expect(res.status).toBe(503);
  });
});
