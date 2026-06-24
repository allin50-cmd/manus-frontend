import { NextRequest, NextResponse } from 'next/server'
import { getDb, osCallLogs } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { desc } from 'drizzle-orm'
import { trackEvent } from '@/lib/ut-tracker'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  const calls = await db.select().from(osCallLogs).orderBy(desc(osCallLogs.calledAt)).limit(100)
  return NextResponse.json(calls)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.callerName) return NextResponse.json({ error: 'callerName is required' }, { status: 400 })

  const db = await getDb()
  const [call] = await db
    .insert(osCallLogs)
    .values({
      direction: body.direction || 'Inbound',
      callerName: body.callerName,
      callerPhone: body.callerPhone || null,
      durationSeconds: body.durationSeconds || 0,
      outcome: body.outcome || 'Answered',
      notes: body.notes || null,
      linkedWorkItemId: body.linkedWorkItemId || null,
      calledAt: body.calledAt ? new Date(body.calledAt) : new Date(),
    })
    .returning()

  await trackEvent({ eventType: 'call_logged', userId: session.person })
  return NextResponse.json(call, { status: 201 })
}
