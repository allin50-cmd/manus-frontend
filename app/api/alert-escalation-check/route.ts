import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '../../../lib/auth'
import { runEscalationCheck } from '../../../lib/alert-dispatch'

async function checkAuth(req: NextRequest): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true
  const session = await getSession()
  return !!session
}

// GET — called by Vercel Cron Jobs (always GET)
export async function GET(req: NextRequest) {
  if (!await checkAuth(req)) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const result = await runEscalationCheck()
  return NextResponse.json({ ok: true, escalated: result.escalated })
}

// POST — called manually from the UI
export async function POST(req: NextRequest) {
  if (!await checkAuth(req)) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const result = await runEscalationCheck()
  return NextResponse.json({ ok: true, escalated: result.escalated })
}
