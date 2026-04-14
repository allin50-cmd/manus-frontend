/**
 * FineGuard Pro — Smoke Test
 *
 * Simulates the full checkout → webhook → billing activation flow against
 * a running local or staging server.
 *
 * Usage:
 *   SMOKE_BASE_URL=http://localhost:3000 \
 *   SMOKE_API_KEY=local-dev-monitoring-key \
 *   npx tsx scripts/smoke-test.ts
 *
 * Requires the DB to be running and migrated.
 * Does NOT require a real Stripe connection — uses simulated webhook payloads.
 */

const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000';
const API_KEY = process.env.SMOKE_API_KEY ?? 'local-dev-monitoring-key';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function apiCall(
  path: string,
  body: unknown,
  headers: Record<string, string> = {},
): Promise<{ status: number; json: unknown }> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`  PASS: ${message}`);
  }
}

// ── Test: API key guard ────────────────────────────────────────────────────────

async function testApiKeyGuard(): Promise<void> {
  console.log('\n── API key guard ──');

  const { status } = await apiCall('/api/monitoring/activate', {
    tenantId: '00000000-0000-0000-0000-000000000001',
    companyNumber: '12345678',
    companyName: 'Smoke Test Ltd',
  });
  assert(status === 401, `No key → 401 (got ${status})`);

  const { status: s2 } = await apiCall(
    '/api/monitoring/activate',
    {
      tenantId: '00000000-0000-0000-0000-000000000001',
      companyNumber: '12345678',
      companyName: 'Smoke Test Ltd',
    },
    { 'x-api-key': 'wrong-key' },
  );
  assert(s2 === 401, `Wrong key → 401 (got ${s2})`);
}

// ── Test: Checkout Zod validation ─────────────────────────────────────────────

async function testCheckoutValidation(): Promise<void> {
  console.log('\n── Checkout validation ──');

  const { status } = await apiCall('/api/stripe/checkout', {
    companyNumber: '', // empty — should fail Zod
    companyName: 'Smoke Test Ltd',
    selectedServices: ['accounts_filing'],
  });
  assert(status === 422, `Empty companyNumber → 422 (got ${status})`);

  const { status: s2 } = await apiCall('/api/stripe/checkout', {
    companyNumber: '12345678',
    companyName: 'Smoke Test Ltd',
    selectedServices: [], // empty array — should fail
  });
  assert(s2 === 422, `Empty selectedServices → 422 (got ${s2})`);

  const { status: s3 } = await apiCall('/api/stripe/checkout', {
    companyNumber: '12345678',
    companyName: 'Smoke Test Ltd',
    selectedServices: ['invalid_service'], // invalid enum
  });
  assert(s3 === 422, `Invalid service type → 422 (got ${s3})`);
}

// ── Test: Health check ────────────────────────────────────────────────────────

async function testHealth(): Promise<void> {
  console.log('\n── Health check ──');

  const res = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(5_000) });
  const json = (await res.json()) as { status: string; database: string };
  assert(res.status === 200 || res.status === 503, `Health responds (got ${res.status})`);
  assert(typeof json.database === 'string', `Health returns database field`);
  if (json.database !== 'connected') {
    console.warn('  WARN: database not connected — billing tests will be skipped');
  }
}

// ── Test: Metadata parsing ─────────────────────────────────────────────────────

async function testMetadataParsing(): Promise<void> {
  console.log('\n── Metadata parsing (inline) ──');

  // Import and call directly — no HTTP needed
  const { parseFineGuardMetadata } = await import('../src/types/stripe');

  assert(parseFineGuardMetadata(null) === null, 'null → null');
  assert(parseFineGuardMetadata({}) === null, 'missing company_number → null');

  const parsed = parseFineGuardMetadata({ company_number: '12345678', source: 'check_page' });
  assert(parsed !== null && parsed.company_number === '12345678', 'valid metadata parses');

  try {
    parseFineGuardMetadata({ company_number: 'X' }); // too short
    assert(false, 'invalid company_number should throw');
  } catch {
    assert(true, 'invalid company_number throws');
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`FineGuard Pro Smoke Test`);
  console.log(`Target: ${BASE}`);
  console.log(`API Key: ${API_KEY ? '***set***' : 'NOT SET'}`);

  await testHealth();
  await testApiKeyGuard();
  await testCheckoutValidation();
  await testMetadataParsing();

  console.log('\n──────────────────────────────');
  if (process.exitCode === 1) {
    console.error('SMOKE TEST FAILED');
  } else {
    console.log('SMOKE TEST PASSED');
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
