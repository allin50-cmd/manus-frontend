import { test, expect } from 'vitest';

const BASE_URL = process.env.TEST_URL || 'https://manus-frontend-c9li.vercel.app';

const routes = [
  { path: '/os/contacts/new', name: 'Contacts' },
  { path: '/os/tasks/new', name: 'Tasks' },
  { path: '/os/calls/new', name: 'Calls' },
  { path: '/os/messages/new', name: 'Messages' },
  { path: '/os/money/quotes/new', name: 'Quotes' },
  { path: '/os/money/invoices/new', name: 'Invoices' },
  { path: '/os/documents/upload', name: 'Documents Upload' },
];

describe('Phase 4 Create Routes - Smoke Tests', () => {
  routes.forEach(({ path, name }) => {
    test(`${name} (${path}) - HTTP 200 and form renders`, async () => {
      const url = `${BASE_URL}${path}`;

      const response = await fetch(url);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/html');

      const html = await response.text();

      // Should contain a form element
      expect(html).toContain('<form');

      // Should contain input, select, or textarea elements
      expect(html).toMatch(/<(?:input|select|textarea)/i);

      // Should not be a 404 error page
      expect(html).not.toContain('404');
      expect(html).not.toContain('This page could not be found');

      // Should not be a 500 error
      expect(html).not.toContain('500');
      expect(html).not.toContain('Internal Server Error');
    });
  });

  test('All routes are accessible', async () => {
    const results = await Promise.all(
      routes.map(async (route) => {
        try {
          const response = await fetch(`${BASE_URL}${route.path}`);
          return {
            route: route.path,
            status: response.status,
            ok: response.status >= 200 && response.status < 300,
          };
        } catch (error) {
          return {
            route: route.path,
            status: 0,
            ok: false,
            error: (error as Error).message,
          };
        }
      })
    );

    const failed = results.filter((r) => !r.ok);
    expect(failed).toHaveLength(0);

    console.log('\n=== ROUTE ACCESSIBILITY SUMMARY ===');
    results.forEach((r) => {
      const status = r.ok ? '✅' : '❌';
      console.log(`${status} ${r.route}: ${r.status}`);
    });
  });
});
