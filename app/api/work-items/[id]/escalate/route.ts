import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../../lib/db'
import { getSession } from '../../../../../lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let item
  try {
    item = await db.workItem.findUnique({ where: { id: params.id } })
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => null)
  if (!body || !body.question) return NextResponse.json({ error: 'question required' }, { status: 400 })

  let decision
  try {
    decision = await db.$transaction(async (tx) => {
      const d = await tx.decision.create({
        data: {
          workItemId: item.id,
          question: body.question,
          options: body.options || null,
          recommendation: body.recommendation || null,
          decisionBy: body.decisionBy || 'George',
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
        },
      })
      await tx.workItem.update({
        where: { id: item.id },
        data: { status: 'Escalated', decisionNeeded: true },
      })
      await tx.activityLog.create({
        data: {
          workItemId: item.id,
          person: session.person,
          eventType: 'DecisionRequested',
          summary: `Escalated to ${body.decisionBy || 'George'}: ${body.question}`,
          oldStatus: item.status,
          newStatus: 'Escalated',
        },
      })
      return d
    })
  } catch {
    return NextResponse.json({ error: 'Could not create escalation' }, { status: 503 })
  }

  return NextResponse.json(decision, { status: 201 })
}
