import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { DecisionStatus } from '@prisma/client'

const VALID_DECISION_STATUSES: DecisionStatus[] = ['Open', 'Approved', 'Rejected', 'MoreInfoNeeded', 'Paused']

// Statuses that mean the work item is finished — don't auto-reset them to InProgress.
const TERMINAL_STATUSES = new Set(['Completed', 'Archived', 'NotFit'])

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let dec
  try {
    dec = await db.decision.findUnique({ where: { id: params.id } })
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
  if (!dec) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.status) return NextResponse.json({ error: 'status required' }, { status: 400 })
  if (!VALID_DECISION_STATUSES.includes(body.status as DecisionStatus)) {
    return NextResponse.json({ error: 'Invalid decision status' }, { status: 400 })
  }

  const newStatus = body.status as DecisionStatus
  const now = new Date()

  let updated
  try {
    updated = await db.decision.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        // Only update decision text when explicitly supplied (don't clear it on status-only updates).
        ...(body.decision !== undefined && { decision: (body.decision as string) || null }),
        decidedAt: ['Approved', 'Rejected', 'MoreInfoNeeded'].includes(newStatus) ? now : null,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Could not update decision' }, { status: 503 })
  }

  await db.activityLog.create({
    data: {
      workItemId: dec.workItemId,
      person: session.person,
      eventType: 'DecisionMade',
      summary: `Decision: ${newStatus}${body.decision ? ` — ${body.decision}` : ''}`,
    },
  }).catch(() => {})

  const resolved = newStatus === 'Approved' || newStatus === 'Rejected'

  if (resolved) {
    const openDecisions = await db.decision.count({
      where: { workItemId: dec.workItemId, status: 'Open' },
    })

    if (openDecisions === 0) {
      const workItem = await db.workItem.findUnique({
        where: { id: dec.workItemId },
        select: { status: true },
      })

      // Don't resurrect items that have already been Completed, Archived, or NotFit.
      if (workItem && !TERMINAL_STATUSES.has(workItem.status)) {
        await db.workItem.update({
          where: { id: dec.workItemId },
          data: { decisionNeeded: false, status: 'InProgress' },
        }).catch(() => {})

        await db.activityLog.create({
          data: {
            workItemId: dec.workItemId,
            person: session.person,
            eventType: 'StatusChanged',
            summary: 'Decision resolved; work item returned to In Progress.',
            oldStatus: workItem.status,
            newStatus: 'InProgress',
          },
        }).catch(() => {})
      }
    }
  }

  return NextResponse.json(updated)
}
