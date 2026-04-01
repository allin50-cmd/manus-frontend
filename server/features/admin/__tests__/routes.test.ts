// ============================================================================
// Admin Routes Integration Tests
// Uses supertest to hit the Express router directly (no network).
// ============================================================================

import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import adminRoutes from '../routes.js';
import { adminStore } from '../store.js';

// Build a minimal Express app with the admin router mounted
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/admin', adminRoutes);
  return app;
}

const app = buildApp();

describe('GET /api/admin/leads', () => {
  it('returns 200 and an array', async () => {
    const res = await request(app).get('/api/admin/leads');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('reflects a newly added lead', async () => {
    const lead = adminStore.addLead({ name: 'Route Test', email: 'rt@example.com' });
    const res = await request(app).get('/api/admin/leads');
    expect(res.status).toBe(200);
    const found = res.body.find((l: { id: string }) => l.id === lead.id);
    expect(found).toBeDefined();
    expect(found.name).toBe('Route Test');
  });
});

describe('GET /api/admin/intake-forms', () => {
  it('returns 200 and an array', async () => {
    const res = await request(app).get('/api/admin/intake-forms');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('reflects a newly added intake form', async () => {
    const form = adminStore.addIntakeForm({ clientName: 'Route IF', matterType: 'test', urgency: 'low' });
    const res = await request(app).get('/api/admin/intake-forms');
    const found = res.body.find((f: { id: string }) => f.id === form.id);
    expect(found).toBeDefined();
    expect(found.clientName).toBe('Route IF');
  });
});

describe('GET /api/admin/compliance-bundles', () => {
  it('returns 200 and an array', async () => {
    const res = await request(app).get('/api/admin/compliance-bundles');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('reflects a newly added bundle', async () => {
    const bundle = adminStore.addComplianceBundle({
      companyName: 'Route Co',
      companyNumber: '00000099',
      bundleType: 'lite',
    });
    const res = await request(app).get('/api/admin/compliance-bundles');
    const found = res.body.find((b: { id: string }) => b.id === bundle.id);
    expect(found).toBeDefined();
    expect(found.companyName).toBe('Route Co');
  });
});

describe('GET /api/admin/contacts', () => {
  it('returns 200 and an array', async () => {
    const res = await request(app).get('/api/admin/contacts');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('reflects a newly added contact', async () => {
    const contact = adminStore.addContact({ name: 'Route Contact', email: 'rc@example.com', message: 'Hi' });
    const res = await request(app).get('/api/admin/contacts');
    const found = res.body.find((c: { id: string }) => c.id === contact.id);
    expect(found).toBeDefined();
    expect(found.name).toBe('Route Contact');
  });
});
