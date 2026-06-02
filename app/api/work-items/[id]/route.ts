import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { WorkItemStatus, Priority } from '@prisma/client'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const item = await db.workItem.findUnique({
    where: { id: params.id },
    include: {
      actions: { orderBy: { createdAt: 'desc' } },
      activityLogs: { orderBy: { createdAt: 'desc' }, take: 50 },
      decisions: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(item)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const item = await db.workItem.findUnique({ where: { id: params.id } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const updates: Record<string, unknown> = {}

  if (body.status) updates.status = body.status as WorkItemStatus
  if (body.priority) updates.priority = body.priority as Priority
  if (body.owner !== undefined) updates.owner = body.owner
  if (body.nextAction !== undefined) updates.nextAction = body.nextAction
  if (body.dueDate !== undefined) updates.dueDate = body.dueDate ? new Date(body.dueDate) : null
  if (body.decisionNeeded !== undefined) updates.decisionNeeded = body.decisionNeeded
  if (body.notes !== undefined) updates.notes = body.notes

  const updated = await db.workItem.update({ where: { id: params.id }, data: updates })

  if (body.status && body.status !== item.status) {
    await db.activityLog.create({
      data: {
        workItemId: item.id,
        person: session.person,
        eventType: 'StatusChanged',
        summary: `Status changed to ${body.status}`,
        oldStatus: item.status,
        newStatus: body.status,
      },
    })
  }

  return NextResponse.json(updated)
}
