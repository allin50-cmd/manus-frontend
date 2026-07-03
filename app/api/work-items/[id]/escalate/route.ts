import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { canTransition, WORK_ITEM_TRANSITIONS } from '@/server/workflow/workflowTransitions'
import type { WorkItemStatus } from '@/lib/types'

const CONFLICT = Symbol('conflict')

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

  const fromStatus = item.status as WorkItemStatus
  if (!canTransition(WORK_ITEM_TRANSITIONS, fromStatus, 'Escalated')) {
    return NextResponse.json(
      { error: `Cannot escalate a work item with status ${fromStatus}` },
      { status: 400 },
    )
  }

  let result
  try {
    result = await db.$transaction(async (tx) => {
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
      // Conditional on the status we validated against, so a concurrent
      // status change landing between the read above and here loses the
      // race cleanly instead of being silently overwritten (same guard as
      // transitionWorkItem in server/workflow/workflowEngine.ts).
      const updateResult = await tx.workItem.updateMany({
        where: { id: item.id, status: fromStatus },
        data: { status: 'Escalated', decisionNeeded: true },
      })
      if (updateResult.count === 0) return CONFLICT
      await tx.activityLog.create({
        data: {
          workItemId: item.id,
          person: session.person,
          eventType: 'DecisionRequested',
          summary: `Escalated to ${body.decisionBy || 'George'}: ${body.question}`,
          oldStatus: fromStatus,
          newStatus: 'Escalated',
        },
      })
      return d
    })
  } catch {
    return NextResponse.json({ error: 'Could not create escalation' }, { status: 503 })
  }

  if (result === CONFLICT) {
    return NextResponse.json(
      { error: 'This item was changed by someone else — refresh and try again' },
      { status: 409 },
    )
  }

  return NextResponse.json(result, { status: 201 })
}
