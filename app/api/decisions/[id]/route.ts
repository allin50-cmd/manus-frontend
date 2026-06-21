import { NextRequest, NextResponse } from 'next/server'
import { getDb, decisions, workItems, activityLogs } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { eq, and, count } from 'drizzle-orm'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()

  const rows = await db.select().from(decisions).where(eq(decisions.id, params.id)).limit(1)
  const dec = rows[0]
  if (!dec) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  if (!body.status) return NextResponse.json({ error: 'status required' }, { status: 400 })

  const newStatus = body.status as string
  const now = new Date()

  const [updated] = await db
    .update(decisions)
    .set({
      status: newStatus as typeof decisions.status._.data,
      decision: body.decision || null,
      decidedAt: ['Approved', 'Rejected', 'MoreInfoNeeded'].includes(newStatus) ? now : null,
    })
    .where(eq(decisions.id, params.id))
    .returning()

  await db.insert(activityLogs).values({
    workItemId: dec.workItemId,
    person: session.person,
    eventType: 'DecisionMade',
    summary: `Decision: ${newStatus}${body.decision ? ` — ${body.decision}` : ''}`,
  })

  // If no more open decisions, clear the decisionNeeded flag
  const countResult = await db
    .select({ count: count() })
    .from(decisions)
    .where(and(eq(decisions.workItemId, dec.workItemId), eq(decisions.status, 'Open')))

  const openDecisions = countResult[0]?.count ?? 0

  if (openDecisions === 0) {
    await db
      .update(workItems)
      .set({ decisionNeeded: false, updatedAt: new Date() })
      .where(eq(workItems.id, dec.workItemId))
  }

  return NextResponse.json(updated)
}
