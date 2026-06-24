/**
 * POST /api/fineguard/process
 *
 * Safe, idempotent daily processing route for the FineGuard compliance workflow.
 * Re-running the same company creates no duplicate alerts — the UNIQUE constraint
 * on fg_alerts (company_number, alert_type, due_date, reminder_date) handles it.
 *
 * Auth: session cookie (admin UI) OR x-cron-secret header (GitHub Actions / cron).
 *
 * Request body:
 *   {}                          → process all active monitored companies
 *   { "companyNumber": "..." }  → process one company
 *
 * Response shape (both single and batch):
 *   {
 *     success: boolean
 *     runId: string
 *     processedCompanies: number
 *     snapshotsCreated: number
 *     alertsCreated: number
 *     duplicatesSkipped: number
 *     remindersProcessed: number
 *     messagesSent: number
 *     messagesLogged: number
 *     errors: number
 *     results: CompanyWorkflowResult[]
 *   }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import {
  processCompany,
  processAllActiveCompanies,
  type CompanyWorkflowResult,
} from '@/lib/fineguard-workflow'

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
    // empty / non-JSON body → process all companies
  }

  const companyNumber =
    typeof body.companyNumber === 'string' ? body.companyNumber.trim() : ''

  if (companyNumber) {
    let result: CompanyWorkflowResult
    try {
      result = await processCompany(companyNumber)
    } catch (err) {
      return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
    }

    // Single-company response uses the same shape as batch for consistency
    return NextResponse.json({
      success: true,
      runId: result.runId,
      processedCompanies: 1,
      snapshotsCreated: result.error ? 0 : 1,
      alertsCreated: result.alertsCreated,
      duplicatesSkipped: result.duplicatesSkipped,
      remindersProcessed: result.remindersProcessed,
      messagesSent: result.messagesSent,
      messagesLogged: result.messagesLogged,
      errors: result.error ? 1 : 0,
      results: [result],
    })
  }

  try {
    const batch = await processAllActiveCompanies()
    return NextResponse.json({ success: true, ...batch })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
