/**
 * FineGuard workflow test script.
 *
 * Usage:
 *   TEST_COMPANY_NUMBER=00000006 npm run fineguard:test-workflow
 *
 * Requires:
 *   DATABASE_URL              — Supabase Postgres connection string
 *   COMPANIES_HOUSE_API_KEY   — Companies House REST API key
 *   TEST_COMPANY_NUMBER       — A company number already in monitored_companies
 *
 * Optional:
 *   RESEND_API_KEY            — If absent, messages are logged instead of emailed (safe)
 *
 * What the script proves:
 *   1. Run 1 processes the company: snapshot saved, alerts scheduled, due reminders dispatched.
 *   2. Run 2 on the same company: duplicatesSkipped > 0, alertsCreated = 0.
 *      This confirms the UNIQUE constraint prevents duplicates.
 *   3. Missing RESEND_API_KEY does not abort the workflow — messagesLogged ≥ 0.
 */

import 'dotenv/config'
import { processCompany } from '../lib/fineguard-workflow'

function check(label: string, pass: boolean) {
  console.log(`  ${pass ? '✓' : '✗'} ${label}`)
  return pass
}

async function main() {
  const num = process.env.TEST_COMPANY_NUMBER
  if (!num) {
    console.error(
      'ERROR: TEST_COMPANY_NUMBER is required.\n' +
      'Example: TEST_COMPANY_NUMBER=00000006 npm run fineguard:test-workflow\n' +
      'The company must already exist in monitored_companies (add via POST /api/monitored).',
    )
    process.exit(1)
  }

  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL is required.')
    process.exit(1)
  }

  if (!process.env.RESEND_API_KEY) {
    console.log('INFO: RESEND_API_KEY not set — messages will be logged only (not emailed). This is expected in test environments.\n')
  }

  console.log(`FineGuard Workflow Test — ${num.toUpperCase()}`)
  console.log('─'.repeat(52))

  // ── Run 1 ────────────────────────────────────────────
  console.log('\n[Run 1] First processing...')
  let r1: Awaited<ReturnType<typeof processCompany>>
  try {
    r1 = await processCompany(num)
  } catch (err) {
    console.error(`\nFATAL on run 1: ${err}`)
    console.error('Is the company number in monitored_companies? Add it with:')
    console.error('  POST /api/monitored  {"companyNumber":"' + num + '","companyName":"Test Co"}')
    process.exit(1)
  }
  console.log(JSON.stringify(r1, null, 2))

  // ── Run 2 — idempotency ───────────────────────────────
  console.log('\n[Run 2] Re-processing same company (idempotency check)...')
  let r2: Awaited<ReturnType<typeof processCompany>>
  try {
    r2 = await processCompany(num)
  } catch (err) {
    console.error(`\nFATAL on run 2: ${err}`)
    process.exit(1)
  }
  console.log(JSON.stringify(r2, null, 2))

  // ── Assertions ────────────────────────────────────────
  console.log('\n─'.repeat(52))
  console.log('Results:')

  let allPassed = true
  allPassed = check('Run 1 completed without error', !r1.error) && allPassed
  allPassed = check('Run 1 created a snapshot', r1.snapshotId !== '') && allPassed
  allPassed = check('Run 2 completed without error', !r2.error) && allPassed
  allPassed = check('Run 2 skipped duplicate alerts (idempotent)', r2.duplicatesSkipped > 0) && allPassed
  allPassed = check('Run 2 created no new alerts', r2.alertsCreated === 0) && allPassed

  // RESEND_API_KEY absent → workflow must not fail
  if (!process.env.RESEND_API_KEY) {
    allPassed = check(
      'No RESEND_API_KEY: workflow did not fail (messages logged only)',
      !r1.error,
    ) && allPassed
  }

  console.log('\n' + (allPassed ? '✓ All checks passed.' : '✗ Some checks failed — see above.'))
  process.exit(allPassed ? 0 : 1)
}

main().catch((err) => {
  console.error('\nUnhandled error:', err)
  process.exit(1)
})
