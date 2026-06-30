import { NextRequest, NextResponse } from 'next/server'
import { getDb, osCallLogs } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  const [callLog] = await db.select().from(osCallLogs).where(eq(osCallLogs.id, params.id)).limit(1)

  if (!callLog) {
    return NextResponse.json({ error: 'Call not found' }, { status: 404 })
  }

  return NextResponse.json(callLog)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.callerName) return NextResponse.json({ error: 'callerName is required' }, { status: 400 })

  const db = await getDb()

  const [callLog] = await db
    .update(osCallLogs)
    .set({
      direction: body.direction || 'Inbound',
      callerName: body.callerName,
      callerPhone: body.callerPhone || null,
      durationSeconds: body.durationSeconds || 0,
      outcome: body.outcome || 'Answered',
      notes: body.notes || null,
      linkedWorkItemId: body.linkedWorkItemId || null,
      calledAt: body.calledAt ? new Date(body.calledAt) : new Date(),
    })
    .where(eq(osCallLogs.id, params.id))
    .returning()

  if (!callLog) {
    return NextResponse.json({ error: 'Call not found' }, { status: 404 })
  }

  return NextResponse.json(callLog)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  const [callLog] = await db.delete(osCallLogs).where(eq(osCallLogs.id, params.id)).returning()

  if (!callLog) {
    return NextResponse.json({ error: 'Call not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
