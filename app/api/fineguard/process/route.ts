/**
 * POST /api/fineguard/process
 *
 * Safe daily processing route for the FineGuard compliance workflow.
 * Idempotent — re-running creates no duplicate alerts (unique constraint guards it).
 *
 * Auth: session cookie (admin UI) OR x-cron-secret header (GitHub Actions / cron).
 *
 * Body:
 *   {}                          → process all active monitored companies
 *   { "companyNumber": "..." }  → process one company
 *
 * Response:
 *   { ok: true, result: CompanyWorkflowResult }     (single)
 *   { ok: true, total, succeeded, failed, results } (batch)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { processCompany, processAllActiveCompanies } from '@/lib/fineguard-workflow'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function hasCronAuth(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  return !!secret && req.headers.get('x-cron-secret') === secret
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session && !hasCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { companyNumber?: string } = {}
  try {
    body = (await req.json()) as { companyNumber?: string }
  } catch {
    // empty body is fine — means "process all"
  }

  const companyNumber = typeof body.companyNumber === 'string' ? body.companyNumber.trim() : ''

  if (companyNumber) {
    try {
      const result = await processCompany(companyNumber)
      return NextResponse.json({ ok: true, result })
    } catch (err) {
      return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
    }
  }

  try {
    const batch = await processAllActiveCompanies()
    return NextResponse.json({ ok: true, ...batch })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
