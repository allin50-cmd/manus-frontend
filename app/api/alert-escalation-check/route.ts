import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { runEscalationCheck } from '@/lib/alert-dispatch'

export async function POST(req: NextRequest) {
  // Accept either a logged-in session or a Vercel Cron bearer token.
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')
  const bearerOk = cronSecret && authHeader === `Bearer ${cronSecret}`

  if (!bearerOk) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const result = await runEscalationCheck()
  return NextResponse.json({ ok: true, escalated: result.escalated })
}
