import { NextRequest, NextResponse } from 'next/server'
import { getDb, workItems, actions, activityLogs } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()

  const rows = await db.select().from(workItems).where(eq(workItems.id, params.id)).limit(1)
  const item = rows[0]
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  if (!body.label) return NextResponse.json({ error: 'label required' }, { status: 400 })

  const [action] = await db.insert(actions).values({
    workItemId: item.id,
    actionType: body.actionType || 'CreateFollowUp',
    label: body.label,
    assignedTo: body.assignedTo || session.person,
    dueDate: body.dueDate ? new Date(body.dueDate) : null,
  }).returning()

  await db.insert(activityLogs).values({
    workItemId: item.id,
    actionId: action.id,
    person: session.person,
    eventType: 'ActionCreated',
    summary: `Follow-up created: ${body.label}`,
  })

  if (body.dueDate) {
    await db
      .update(workItems)
      .set({ nextAction: body.label, dueDate: new Date(body.dueDate), updatedAt: new Date() })
      .where(eq(workItems.id, item.id))

    await db.insert(activityLogs).values({
      workItemId: item.id,
      person: session.person,
      eventType: 'FollowUpSet',
      summary: `Follow-up set: ${body.label} due ${body.dueDate}`,
    })
  }

  return NextResponse.json(action, { status: 201 })
}
