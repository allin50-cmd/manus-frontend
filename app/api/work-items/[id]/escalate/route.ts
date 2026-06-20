import { NextRequest, NextResponse } from 'next/server'
import { getDb, workItems, decisions, activityLogs } from '@/lib/db'
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
  if (!body.question) return NextResponse.json({ error: 'question required' }, { status: 400 })

  const [[decision]] = await Promise.all([
    db.insert(decisions).values({
      workItemId: item.id,
      question: body.question,
      options: body.options || null,
      recommendation: body.recommendation || null,
      decisionBy: body.decisionBy || 'George',
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    }).returning(),
    db.update(workItems)
      .set({ status: 'Escalated', decisionNeeded: true, updatedAt: new Date() })
      .where(eq(workItems.id, item.id)),
  ])

  await db.insert(activityLogs).values({
    workItemId: item.id,
    person: session.person,
    eventType: 'DecisionRequested',
    summary: `Escalated to ${body.decisionBy || 'George'}: ${body.question}`,
    oldStatus: item.status,
    newStatus: 'Escalated',
  })

  return NextResponse.json(decision, { status: 201 })
}
