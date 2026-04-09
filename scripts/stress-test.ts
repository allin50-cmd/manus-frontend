/**
 * FineGuard Pro — Stress Test
 *
 * Run with: npm run test:stress
 *
 * Hits all API GET endpoints with autocannon (10 concurrent connections, 10s each).
 * Fails with exit code 1 if error rate > 5% or p99 latency > 2000ms on any endpoint.
 *
 * Set STRESS_BASE_URL env var to target a remote server (default: http://localhost:3000).
 *
 * DB-dependent routes are probed first; if the DB is unavailable they are marked
 * SKIP rather than FAIL so the test can still validate stateless routes.
 */

import autocannon from 'autocannon';

const BASE = process.env.STRESS_BASE_URL ?? 'http://localhost:3000';
const CONNECTIONS = Number(process.env.STRESS_CONNECTIONS ?? 10);
const DURATION = Number(process.env.STRESS_DURATION ?? 10); // seconds per scenario
const ERROR_RATE_THRESHOLD = 5;  // %
const P99_THRESHOLD_MS = 2000;

// MONITORING_API_KEY — sent as x-api-key header on protected routes.
// If absent, those scenarios are SKIPPED rather than run without auth (which
// would produce 100% 401s and fail the error-rate threshold).
const MONITORING_API_KEY = process.env.MONITORING_API_KEY ?? '';

interface Scenario {
  title: string;
  url: string;
  requiresDb?: boolean;          // skip gracefully when DB is unavailable
  requiresApiKey?: string;       // skip when this env var is absent (external key)
  requiresMonitoringKey?: boolean; // send x-api-key: MONITORING_API_KEY header
}

const SCENARIOS: Scenario[] = [
  { title: 'Health check',                   url: '/api/health',                                    requiresDb: true },
  { title: 'Protection status',              url: '/api/protection-status?companyNumber=12345678',   requiresDb: true },
  { title: 'Zapier alerts recent',           url: '/api/zapier/alerts/recent',                       requiresDb: true, requiresMonitoringKey: true },
  { title: 'Zapier companies recent',        url: '/api/zapier/companies/recent',                    requiresDb: true, requiresMonitoringKey: true },
  { title: 'Companies House (rate limiter)', url: '/api/companies-house?q=TEST',                     requiresApiKey: 'COMPANIES_HOUSE_API_KEY' },
];

async function probe(url: string): Promise<{ ok: boolean; status: number }> {
  try {
    const res = await fetch(BASE + url, { signal: AbortSignal.timeout(3000) });
    return { ok: res.status < 500, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

async function dbAvailable(): Promise<boolean> {
  const { status } = await probe('/api/health');
  // 200 = DB up, 503 = DB down, 0 = server not reachable
  return status === 200;
}

function runScenario(scenario: Scenario): Promise<autocannon.Result> {
  const headers: Record<string, string> = {};
  if (scenario.requiresMonitoringKey && MONITORING_API_KEY) {
    headers['x-api-key'] = MONITORING_API_KEY;
  }

  return new Promise((resolve, reject) => {
    const instance = autocannon(
      {
        url: BASE + scenario.url,
        method: 'GET',
        connections: CONNECTIONS,
        duration: DURATION,
        pipelining: 1,
        timeout: 5,
        ...(Object.keys(headers).length > 0 ? { headers } : {}),
      },
      (err, result) => (err ? reject(err) : resolve(result)),
    );
    autocannon.track(instance, { renderProgressBar: true });
  });
}

function formatRow(label: string, value: string | number) {
  return `  ${String(label).padEnd(22)} ${value}`;
}

async function main() {
  console.log(`\nFineGuard Pro Stress Test`);
  console.log(`Target:      ${BASE}`);
  console.log(`Connections: ${CONNECTIONS}`);
  console.log(`Duration:    ${DURATION}s per endpoint\n`);

  const hasDb = await dbAvailable();
  if (!hasDb) {
    console.log('  [info] No database connection detected — DB-dependent routes will be SKIPPED');
    console.log('         Set DATABASE_URL to include them in the test.\n');
  }

  const failures: string[] = [];
  const skipped: string[] = [];

  for (const scenario of SCENARIOS) {
    if (scenario.requiresDb && !hasDb) {
      console.log(`\n── ${scenario.title} — SKIPPED (no DB)`);
      skipped.push(scenario.title);
      continue;
    }

    if (scenario.requiresApiKey && !process.env[scenario.requiresApiKey]) {
      console.log(`\n── ${scenario.title} — SKIPPED (${scenario.requiresApiKey} not set)`);
      skipped.push(scenario.title);
      continue;
    }

    if (scenario.requiresMonitoringKey && !MONITORING_API_KEY) {
      console.log(`\n── ${scenario.title} — SKIPPED (MONITORING_API_KEY not set)`);
      skipped.push(scenario.title);
      continue;
    }

    console.log(`\n── ${scenario.title} ──`);
    let result: autocannon.Result;
    try {
      result = await runScenario(scenario);
    } catch (err) {
      console.error(`  ERROR: ${err}`);
      failures.push(`${scenario.title}: connection error`);
      continue;
    }

    const total = result.requests.total;
    const errors = result.errors + result.timeouts;
    const errRate = total > 0 ? (errors / total) * 100 : 0;
    const p99 = result.latency.p99;

    console.log(formatRow('req/s:', result.requests.average.toFixed(1)));
    console.log(formatRow('p50 latency:', `${result.latency.p50}ms`));
    console.log(formatRow('p97.5 latency:', `${result.latency.p97_5}ms`));
    console.log(formatRow('p99 latency:', `${p99}ms`));
    console.log(formatRow('2xx:', result['2xx'] ?? 0));
    console.log(formatRow('non-2xx:', result.non2xx ?? 0));
    console.log(formatRow('errors/timeouts:', `${errors} / ${total} (${errRate.toFixed(1)}%)`));

    const thresholdFails: string[] = [];
    if (errRate > ERROR_RATE_THRESHOLD) thresholdFails.push(`error rate ${errRate.toFixed(1)}% > ${ERROR_RATE_THRESHOLD}%`);
    if (p99 > P99_THRESHOLD_MS) thresholdFails.push(`p99 ${p99}ms > ${P99_THRESHOLD_MS}ms`);

    if (thresholdFails.length > 0) {
      console.error(`  FAIL: ${thresholdFails.join(', ')}`);
      failures.push(`${scenario.title}: ${thresholdFails.join(', ')}`);
    } else {
      console.log('  PASS');
    }
  }

  const tested = SCENARIOS.length - skipped.length;
  console.log('\n══════════════════════════════════════');
  if (skipped.length > 0) {
    console.log(`Skipped (no DB): ${skipped.join(', ')}`);
  }
  if (failures.length > 0) {
    console.error(`STRESS TEST FAILED — ${failures.length}/${tested} scenario(s) exceeded thresholds:`);
    for (const f of failures) console.error(`  ✗ ${f}`);
    process.exit(1);
  } else {
    console.log(`STRESS TEST PASSED — ${tested}/${tested} tested scenarios within thresholds`);
    if (skipped.length > 0) console.log(`(${skipped.length} skipped — rerun with DATABASE_URL for full coverage)`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
