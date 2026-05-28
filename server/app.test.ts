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
