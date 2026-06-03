import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { runEscalationCheck } from '@/lib/alert-dispatch'

export async function POST(_req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const result = await runEscalationCheck()

  return NextResponse.json({ ok: true, escalated: result.escalated })
}
