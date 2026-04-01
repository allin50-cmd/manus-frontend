// ============================================================================
// FineGuard Routes Integration Tests
// Uses supertest against the real Express router with the mock CH adapter.
// DATABASE_URL is not set so getStore() falls back to MemoryStore.
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import fgRoutes from '../routes.js';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/fg', fgRoutes);
  return app;
}

// ─── Company Search ───────────────────────────────────────────────────────────

describe('GET /api/fg/company/search', () => {
  const app = buildApp();

  it('returns 400 when query is missing', async () => {
    const res = await request(app).get('/api/fg/company/search');
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it('returns 400 when query is too short', async () => {
    const res = await request(app).get('/api/fg/company/search?q=a');
    expect(res.status).toBe(400);
  });

  it('returns 200 with results array for valid query', async () => {
    const res = await request(app).get('/api/fg/company/search?q=test');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.results)).toBe(true);
  });
});

// ─── Company Lookup ───────────────────────────────────────────────────────────

describe('GET /api/fg/company/:number', () => {
  const app = buildApp();

  it('returns 400 for invalid company number format', async () => {
    const res = await request(app).get('/api/fg/company/INVALID!!');
    expect(res.status).toBe(400);
  });

  it('returns 200 for mock company 00000001', async () => {
    const res = await request(app).get('/api/fg/company/00000001');
    expect(res.status).toBe(200);
    expect(res.body.companyNumber).toBe('00000001');
    expect(res.body.companyName).toBeTruthy();
  });

  it('returns 404 for unknown company number', async () => {
    const res = await request(app).get('/api/fg/company/99999999');
    expect(res.status).toBe(404);
  });

  it('response includes deadline fields', async () => {
    const res = await request(app).get('/api/fg/company/00000001');
    expect(res.status).toBe(200);
    expect('nextConfirmationStatementDue' in res.body).toBe(true);
    expect('nextAccountsDue' in res.body).toBe(true);
  });
});

// ─── Monitoring ───────────────────────────────────────────────────────────────

describe('POST /api/fg/monitoring', () => {
  const app = buildApp();

  it('returns 400 when companyId is missing', async () => {
    const res = await request(app).post('/api/fg/monitoring').send({});
    expect(res.status).toBe(400);
  });

  it('starts monitoring for a valid mock company', async () => {
    // Look up the company first to get its internal companyId
    const lookup = await request(app).get('/api/fg/company/00000001');
    expect(lookup.status).toBe(200);
    const { companyId } = lookup.body;

    const res = await request(app)
      .post('/api/fg/monitoring')
      .send({ companyId });
    expect(res.status).toBe(200);
    expect(res.body.monitoring.companyId).toBeTruthy();
    expect(res.body.monitoring.monitoringEnabled).toBe(true);
  });
});

describe('GET /api/fg/monitoring/:companyId', () => {
  const app = buildApp();
  let companyId: string;

  beforeEach(async () => {
    // Look up company 00000002, then start monitoring
    const lookup = await request(app).get('/api/fg/company/00000002');
    companyId = lookup.body.companyId;
    await request(app).post('/api/fg/monitoring').send({ companyId });
  });

  it('returns monitoring data for a known companyId', async () => {
    const res = await request(app).get(`/api/fg/monitoring/${companyId}`);
    expect(res.status).toBe(200);
    expect(res.body.company).toBeDefined();
    expect(res.body.monitoring).toBeDefined();
    expect(Array.isArray(res.body.alerts)).toBe(true);
  });

  it('returns 404 for unknown companyId', async () => {
    const res = await request(app).get('/api/fg/monitoring/nonexistent-id');
    expect(res.status).toBe(404);
  });
});

// ─── Alerts ───────────────────────────────────────────────────────────────────

describe('GET /api/fg/alerts', () => {
  const app = buildApp();

  it('returns 200 with alerts array', async () => {
    const res = await request(app).get('/api/fg/alerts');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.alerts)).toBe(true);
  });
});

describe('PATCH /api/fg/alerts/:id/handled', () => {
  const app = buildApp();

  it('returns 404 for non-existent alert id', async () => {
    const res = await request(app).patch('/api/fg/alerts/nonexistent/handled');
    expect(res.status).toBe(404);
  });
});

// ─── Sweep ────────────────────────────────────────────────────────────────────

describe('POST /api/fg/sweep', () => {
  const app = buildApp();

  it('returns 200 with sweep result', async () => {
    const res = await request(app).post('/api/fg/sweep');
    expect(res.status).toBe(200);
    expect(typeof res.body.companiesChecked).toBe('number');
    expect(typeof res.body.alertsCreated).toBe('number');
  });
});

// ─── Audit History ────────────────────────────────────────────────────────────

describe('GET /api/fg/history/:companyId', () => {
  const app = buildApp();
  let companyId: string;

  beforeEach(async () => {
    const lookup = await request(app).get('/api/fg/company/00000003');
    companyId = lookup.body.companyId;
    await request(app).post('/api/fg/monitoring').send({ companyId });
  });

  it('returns 200 with audit entries array', async () => {
    const res = await request(app).get(`/api/fg/history/${companyId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.auditLog)).toBe(true);
  });

  it('returns 404 for unknown companyId', async () => {
    const res = await request(app).get('/api/fg/history/nonexistent-id');
    expect(res.status).toBe(404);
  });
});
