import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { DecisionStatus } from '@prisma/client'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dec = await db.decision.findUnique({ where: { id: params.id } })
  if (!dec) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  if (!body.status) return NextResponse.json({ error: 'status required' }, { status: 400 })

  const newStatus = body.status as DecisionStatus
  const now = new Date()

  const updated = await db.decision.update({
    where: { id: params.id },
    data: {
      status: newStatus,
      decision: body.decision || null,
      decidedAt: ['Approved', 'Rejected', 'MoreInfoNeeded'].includes(newStatus) ? now : null,
    },
  })

  await db.activityLog.create({
    data: {
      workItemId: dec.workItemId,
      person: session.person,
      eventType: 'DecisionMade',
      summary: `Decision: ${newStatus}${body.decision ? ` — ${body.decision}` : ''}`,
    },
  })

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

      await db.workItem.update({
        where: { id: dec.workItemId },
        data: { decisionNeeded: false, status: 'InProgress' },
      })

      await db.activityLog.create({
        data: {
          workItemId: dec.workItemId,
          person: session.person,
          eventType: 'StatusChanged',
          summary: 'Decision resolved; work item returned to In Progress.',
          oldStatus: workItem?.status ?? null,
          newStatus: 'InProgress',
        },
      })
    }
  }

  return NextResponse.json(updated)
}
