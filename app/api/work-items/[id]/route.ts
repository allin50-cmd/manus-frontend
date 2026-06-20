import { NextRequest, NextResponse } from 'next/server'
import { getDb, workItems, actions, activityLogs, decisions } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { eq, desc } from 'drizzle-orm'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()

  const rows = await db.select().from(workItems).where(eq(workItems.id, params.id)).limit(1)
  const item = rows[0]
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [itemActions, itemLogs, itemDecisions] = await Promise.all([
    db.select().from(actions).where(eq(actions.workItemId, params.id)).orderBy(desc(actions.createdAt)).limit(20),
    db.select().from(activityLogs).where(eq(activityLogs.workItemId, params.id)).orderBy(desc(activityLogs.createdAt)).limit(50),
    db.select().from(decisions).where(eq(decisions.workItemId, params.id)).orderBy(desc(decisions.createdAt)),
  ])

  return NextResponse.json({ ...item, actions: itemActions, activityLogs: itemLogs, decisions: itemDecisions })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()

  const rows = await db.select().from(workItems).where(eq(workItems.id, params.id)).limit(1)
  const item = rows[0]
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const updates: Record<string, unknown> = {}

  if (body.status) updates.status = body.status
  if (body.priority) updates.priority = body.priority
  if (body.owner !== undefined) updates.owner = body.owner
  if (body.nextAction !== undefined) updates.nextAction = body.nextAction
  if (body.dueDate !== undefined) updates.dueDate = body.dueDate ? new Date(body.dueDate) : null
  if (body.decisionNeeded !== undefined) updates.decisionNeeded = body.decisionNeeded
  if (body.notes !== undefined) updates.notes = body.notes

  const [updated] = await db
    .update(workItems)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(workItems.id, params.id))
    .returning()

  if (body.status && body.status !== item.status) {
    await db.insert(activityLogs).values({
      workItemId: item.id,
      person: session.person,
      eventType: 'StatusChanged',
      summary: `Status changed to ${body.status}`,
      oldStatus: item.status,
      newStatus: body.status,
    })
  }

  return NextResponse.json(updated)
}
