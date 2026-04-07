/**
 * FineGuard Pro — Stress Test
 *
 * Run with: npm run test:stress
 *
 * Hits all API GET endpoints with autocannon (10 concurrent connections, 10s each).
 * Fails with exit code 1 if error rate > 5% or p99 latency > 2000ms on any endpoint.
 *
 * Set STRESS_BASE_URL env var to target a remote server (default: http://localhost:3000).
 */

import autocannon from 'autocannon';

const BASE = process.env.STRESS_BASE_URL ?? 'http://localhost:3000';
const CONNECTIONS = Number(process.env.STRESS_CONNECTIONS ?? 10);
const DURATION = Number(process.env.STRESS_DURATION ?? 10); // seconds per scenario
const ERROR_RATE_THRESHOLD = 5;  // %
const P99_THRESHOLD_MS = 2000;

interface Scenario {
  title: string;
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

const SCENARIOS: Scenario[] = [
  {
    title: 'Health check',
    url: '/api/health',
  },
  {
    title: 'Protection status (no company)',
    url: '/api/protection-status?companyNumber=12345678',
  },
  {
    title: 'Zapier alerts recent',
    url: '/api/zapier/alerts/recent',
  },
  {
    title: 'Zapier companies recent',
    url: '/api/zapier/companies/recent',
  },
  {
    title: 'Companies House search (invalid key expected)',
    url: '/api/companies-house?q=TEST',
  },
];

function runScenario(scenario: Scenario): Promise<autocannon.Result> {
  return new Promise((resolve, reject) => {
    const instance = autocannon(
      {
        url: BASE + scenario.url,
        method: (scenario.method as autocannon.Request['method']) ?? 'GET',
        connections: CONNECTIONS,
        duration: DURATION,
        pipelining: 1,
        headers: scenario.headers,
        body: scenario.body,
        timeout: 5,
      },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      },
    );
    autocannon.track(instance, { renderProgressBar: true });
  });
}

function formatRow(label: string, value: string | number) {
  return `  ${label.padEnd(20)} ${value}`;
}

async function main() {
  console.log(`\nFineGuard Pro Stress Test`);
  console.log(`Target:      ${BASE}`);
  console.log(`Connections: ${CONNECTIONS}`);
  console.log(`Duration:    ${DURATION}s per endpoint\n`);

  const failures: string[] = [];

  for (const scenario of SCENARIOS) {
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
    console.log(formatRow('p95 latency:', `${result.latency.p95}ms`));
    console.log(formatRow('p99 latency:', `${p99}ms`));
    console.log(formatRow('errors:', `${errors} / ${total} (${errRate.toFixed(1)}%)`));
    console.log(formatRow('2xx:', `${result['2xx'] ?? 0}`));
    console.log(formatRow('non-2xx:', `${result.non2xx ?? 0}`));

    const thresholdFails: string[] = [];
    if (errRate > ERROR_RATE_THRESHOLD) {
      thresholdFails.push(`error rate ${errRate.toFixed(1)}% > ${ERROR_RATE_THRESHOLD}%`);
    }
    if (p99 > P99_THRESHOLD_MS) {
      thresholdFails.push(`p99 ${p99}ms > ${P99_THRESHOLD_MS}ms`);
    }

    if (thresholdFails.length > 0) {
      console.error(`  FAIL: ${thresholdFails.join(', ')}`);
      failures.push(`${scenario.title}: ${thresholdFails.join(', ')}`);
    } else {
      console.log('  PASS');
    }
  }

  console.log('\n══════════════════════════════════════');
  if (failures.length > 0) {
    console.error(`STRESS TEST FAILED (${failures.length} scenario(s)):`);
    for (const f of failures) {
      console.error(`  ✗ ${f}`);
    }
    process.exit(1);
  } else {
    console.log(`STRESS TEST PASSED — all ${SCENARIOS.length} scenarios within thresholds`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
