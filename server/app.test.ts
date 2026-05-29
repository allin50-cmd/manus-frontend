import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AddressInfo } from 'net';
import { createServer, Server } from 'http';
import { createApp } from './app';

let server: Server | undefined;
let baseUrl = '';

async function startTestServer() {
  const app = createApp();
  server = createServer(app);

  await new Promise<void>((resolve) => {
    server!.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
}

async function stopTestServer() {
  if (!server) return;

  await new Promise<void>((resolve, reject) => {
    server!.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  server = undefined;
  baseUrl = '';
}

describe('API CORS policy', () => {
  beforeEach(async () => {
    process.env.APP_URL = 'https://manus-frontend-zeta.vercel.app';
    process.env.ADMIN_API_KEY = 'test-admin-key';
    await startTestServer();
  });

  afterEach(async () => {
    await stopTestServer();
    delete process.env.APP_URL;
    delete process.env.ADMIN_API_KEY;
  });

  it('allows the configured app origin', async () => {
    const response = await fetch(`${baseUrl}/api/not-found`, {
      headers: { Origin: 'https://manus-frontend-zeta.vercel.app' },
    });

    expect(response.headers.get('access-control-allow-origin')).toBe('https://manus-frontend-zeta.vercel.app');
  });

  it('allows local development origins', async () => {
    const response = await fetch(`${baseUrl}/api/not-found`, {
      headers: { Origin: 'http://localhost:5173' },
    });

    expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:5173');
  });

  it('does not echo arbitrary external origins', async () => {
    const response = await fetch(`${baseUrl}/api/not-found`, {
      headers: { Origin: 'https://example.invalid' },
    });

    expect(response.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('does not allow admin-key preflight from arbitrary external origins', async () => {
    const response = await fetch(`${baseUrl}/api/admin/leads`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://example.invalid',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'X-ADMIN-KEY',
      },
    });

    expect(response.headers.get('access-control-allow-origin')).toBeNull();
  });
});

describe('Voice agent API bridge', () => {
  beforeEach(async () => {
    process.env.APP_URL = 'https://manus-frontend-zeta.vercel.app';
    process.env.ADMIN_API_KEY = 'test-admin-key';
    await startTestServer();
  });

  afterEach(async () => {
    await stopTestServer();
    delete process.env.APP_URL;
    delete process.env.ADMIN_API_KEY;
  });

  it('returns same-origin bridge health without requiring admin auth', async () => {
    const response = await fetch(`${baseUrl}/api/voice-reception/health`);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.service).toBe('voice-reception');
    expect(body.mode).toBe('same-origin');
  });

  it('processes transcripts through the same deterministic contract as the control surface', async () => {
    const response = await fetch(`${baseUrl}/api/voice-reception/process-transcript`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: 'voice-api-test-1',
        caller: '+442000000000',
        transcript: 'I need a builder for a renovation in South London.',
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.intent).toBe('construction_lead');
    expect(body.risk_level).toBe('low');
    expect(body.policy_decision).toBe('ALLOW');
    expect(body.next_action).toBe('Route construction enquiry to Accuracy Developments Ltd.');
    expect(body.audit_event_id).toBeTruthy();
  });
});
