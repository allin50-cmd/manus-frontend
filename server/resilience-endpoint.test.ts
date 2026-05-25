/**
 * End-to-end test of GET /api/internal/resilience.
 *
 * Drives the real Express app via Node's http server + global fetch.
 * No supertest dependency.
 *
 * Env-var contract for createApp():
 *   - ADMIN_API_KEY            required for the endpoint to authorize
 *   - COMPANIES_HOUSE_API_KEY  required because the CH service constructs
 *                              at module load (pre-existing cold-start
 *                              behaviour; placeholder is fine)
 */
import { vi } from 'vitest';

vi.hoisted(() => {
  process.env.ADMIN_API_KEY = 'test-admin-key';
  process.env.COMPANIES_HOUSE_API_KEY = 'placeholder';
});

import http from 'http';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createApp } from './app';
import {
  __resetResilienceStatsForTests,
  recordOperationFailure,
  recordOperationSuccess,
} from './lib/resilience-stats';
import { __resetCircuitBreakerForTests, recordFailure, configureDependency } from './lib/circuit-breaker';

interface ResilienceResponse {
  timestamp: string;
  circuits: Record<string, { state: string; failures: number; cooldownRemainingMs: number; lastFailureAt: number; openedAt: number }>;
  stats: Record<string, { totalSuccesses: number; totalFailures: number; successRate: number; failureRate: number; lastSuccessAt: number; lastFailureAt: number }>;
  recentTraces: Array<{ at: number; correlationId: string; operation: string; dependency: string | null; status: 'success' | 'failure'; outcome?: 'circuit_open' }>;
  system: { instanceId: string; uptimeMs: number };
  partialErrors?: string[];
}

async function getJson(url: string, init?: RequestInit): Promise<ResilienceResponse> {
  const res = await fetch(url, init);
  return (await res.json()) as ResilienceResponse;
}

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
  __resetResilienceStatsForTests();
  __resetCircuitBreakerForTests();
});

describe('GET /api/internal/resilience: auth', () => {
  it('returns 401 without admin key', async () => {
    const res = await fetch(`${baseUrl}/api/internal/resilience`);
    expect(res.status).toBe(401);
  });

  it('returns 401 with wrong admin key', async () => {
    const res = await fetch(`${baseUrl}/api/internal/resilience`, {
      headers: { 'x-admin-key': 'wrong' },
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/internal/resilience: success path', () => {
  it('returns 200 with the expected envelope when nothing has been recorded', async () => {
    const res = await fetch(`${baseUrl}/api/internal/resilience`, {
      headers: { 'x-admin-key': 'test-admin-key' },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as ResilienceResponse;

    expect(typeof body.timestamp).toBe('string');
    expect(body.circuits).toEqual({});
    expect(body.stats).toEqual({});
    expect(body.recentTraces).toEqual([]);
    expect(typeof body.system.instanceId).toBe('string');
    expect(body.system.uptimeMs).toBeGreaterThanOrEqual(0);
    expect(body.partialErrors).toBeUndefined();
  });

  it('returns 200 with populated circuits + stats + traces after activity', async () => {
    configureDependency('fineguard_activation', {
      failureThreshold: 3,
      windowMs: 60_000,
      cooldownMs: 30_000,
    });
    // Synthesise a couple of failures + a success against the circuit + stats.
    recordFailure('fineguard_activation', 1_000);
    recordFailure('fineguard_activation', 2_000);
    recordOperationFailure('fineguard_activation', { correlationId: 'c1', operation: 'pie.fineguard.upsert' }, 2_000);
    recordOperationFailure('fineguard_activation', { correlationId: 'c2', operation: 'pie.fineguard.upsert' }, 2_500);
    recordOperationSuccess('fineguard_activation', { correlationId: 'c3', operation: 'pie.fineguard.upsert' }, 3_000);

    const res = await fetch(`${baseUrl}/api/internal/resilience`, {
      headers: { 'x-admin-key': 'test-admin-key' },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as ResilienceResponse;

    expect(body.circuits.fineguard_activation).toBeDefined();
    expect(body.circuits.fineguard_activation.state).toBe('closed'); // below threshold
    expect(body.circuits.fineguard_activation.failures).toBe(2);

    const fgStats = body.stats.fineguard_activation;
    expect(fgStats.totalSuccesses).toBe(1);
    expect(fgStats.totalFailures).toBe(2);
    expect(fgStats.successRate).toBeCloseTo(1 / 3);
    expect(fgStats.failureRate).toBeCloseTo(2 / 3);

    expect(body.recentTraces).toHaveLength(3);
    expect(body.recentTraces.map(t => t.correlationId)).toEqual(['c1', 'c2', 'c3']);
  });

  it('reports an OPEN circuit with cooldownRemainingMs > 0', async () => {
    configureDependency('companies_house_api', {
      failureThreshold: 2,
      windowMs: 60_000,
      cooldownMs: 30_000,
    });
    recordFailure('companies_house_api', Date.now() - 5_000);
    recordFailure('companies_house_api', Date.now() - 1_000);

    const res = await fetch(`${baseUrl}/api/internal/resilience`, {
      headers: { 'x-admin-key': 'test-admin-key' },
    });
    const body = (await res.json()) as ResilienceResponse;
    const circuit = body.circuits.companies_house_api;
    expect(circuit.state).toBe('open');
    expect(circuit.cooldownRemainingMs).toBeGreaterThan(0);
    expect(circuit.failures).toBe(2);
  });
});

describe('GET /api/internal/resilience: safety', () => {
  it('returned trace entries expose only the documented fields (no PII)', async () => {
    recordOperationSuccess('fineguard_activation', { correlationId: 'c1', operation: 'op' });
    const body = await getJson(`${baseUrl}/api/internal/resilience`, {
      headers: { 'x-admin-key': 'test-admin-key' },
    });
    const trace = body.recentTraces[0] as Record<string, unknown>;
    const allowed = ['at', 'correlationId', 'dependency', 'operation', 'status', 'outcome'];
    for (const key of Object.keys(trace)) {
      expect(allowed).toContain(key);
    }
  });

  it('rotates the ring buffer at 20 entries when exposed via the endpoint', async () => {
    for (let i = 0; i < 25; i++) {
      recordOperationSuccess('fineguard_activation', { correlationId: `c${i}`, operation: 'op' }, i);
    }
    const body = await getJson(`${baseUrl}/api/internal/resilience`, {
      headers: { 'x-admin-key': 'test-admin-key' },
    });
    expect(body.recentTraces).toHaveLength(20);
    expect(body.recentTraces[0].correlationId).toBe('c5');
    expect(body.recentTraces[19].correlationId).toBe('c24');
  });

  it('exposes stable instanceId across calls', async () => {
    const a = await getJson(`${baseUrl}/api/internal/resilience`, {
      headers: { 'x-admin-key': 'test-admin-key' },
    });
    const b = await getJson(`${baseUrl}/api/internal/resilience`, {
      headers: { 'x-admin-key': 'test-admin-key' },
    });
    expect(a.system.instanceId).toBe(b.system.instanceId);
  });
});
