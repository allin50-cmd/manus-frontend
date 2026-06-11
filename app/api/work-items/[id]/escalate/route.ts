import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const item = await db.workItem.findUnique({ where: { id: params.id } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => null)
  if (!body || !body.question) return NextResponse.json({ error: 'question required' }, { status: 400 })

  const [decision] = await Promise.all([
    db.decision.create({
      data: {
        workItemId: item.id,
        question: body.question,
        options: body.options || null,
        recommendation: body.recommendation || null,
        decisionBy: body.decisionBy || 'George',
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      },
    }),
    db.workItem.update({
      where: { id: item.id },
      data: { status: 'Escalated', decisionNeeded: true },
    }),
  ])

  await db.activityLog.create({
    data: {
      workItemId: item.id,
      person: session.person,
      eventType: 'DecisionRequested',
      summary: `Escalated to ${body.decisionBy || 'George'}: ${body.question}`,
      oldStatus: item.status,
      newStatus: 'Escalated',
    },
  })

  return NextResponse.json(decision, { status: 201 })
}
