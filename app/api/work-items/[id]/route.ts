import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { WorkItemStatus, Priority, WorkItemType } from '@prisma/client'
import { isValidType, isValidStatus, isValidPriority } from '@/lib/work-item-enums'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let item
  try {
    item = await db.workItem.findUnique({
      where: { id: params.id },
      include: {
        actions: { orderBy: { createdAt: 'desc' } },
        activityLogs: { orderBy: { createdAt: 'desc' }, take: 50 },
        decisions: { orderBy: { createdAt: 'desc' } },
      },
    })
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(item)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let item
  try {
    item = await db.workItem.findUnique({ where: { id: params.id } })
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (body.type !== undefined && !isValidType(body.type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }
  if (body.status !== undefined && !isValidStatus(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  if (body.priority !== undefined && !isValidPriority(body.priority)) {
    return NextResponse.json({ error: 'Invalid priority' }, { status: 400 })
  }

  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) {
      return NextResponse.json({ error: 'title must be a non-empty string' }, { status: 400 })
    }
  }

  if (body.owner !== undefined) {
    if (typeof body.owner !== 'string' || !body.owner.trim()) {
      return NextResponse.json({ error: 'owner must be a non-empty string' }, { status: 400 })
    }
  }

  // Validate dueDate up front so an unparseable value is a 400, not a Prisma 503.
  let parsedDueDate: Date | null | undefined
  if (body.dueDate !== undefined) {
    if (body.dueDate === null || body.dueDate === '') {
      parsedDueDate = null
    } else {
      const d = new Date(body.dueDate as string)
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: 'Invalid dueDate' }, { status: 400 })
      }
      parsedDueDate = d
    }
  }

  const updates: Record<string, unknown> = {}
  if (body.title !== undefined) updates.title = (body.title as string).trim()
  if (body.type !== undefined && isValidType(body.type)) updates.type = body.type as WorkItemType
  if (body.company !== undefined) updates.company = body.company || null
  if (body.contactName !== undefined) updates.contactName = body.contactName || null
  if (body.status !== undefined && isValidStatus(body.status)) updates.status = body.status as WorkItemStatus
  if (body.priority !== undefined && isValidPriority(body.priority)) updates.priority = body.priority as Priority
  if (body.owner !== undefined) updates.owner = (body.owner as string).trim()
  if (body.nextAction !== undefined) updates.nextAction = body.nextAction
  if (body.dueDate !== undefined) updates.dueDate = parsedDueDate
  if (body.decisionNeeded !== undefined) updates.decisionNeeded = body.decisionNeeded
  if (body.notes !== undefined) updates.notes = body.notes

  let updated
  try {
    updated = await db.workItem.update({ where: { id: params.id }, data: updates })
  } catch {
    return NextResponse.json({ error: 'Could not update work item' }, { status: 503 })
  }

  if (body.status && body.status !== item.status) {
    await db.activityLog.create({
      data: {
        workItemId: item.id,
        person: session.person,
        eventType: 'StatusChanged',
        summary: `Status changed to ${body.status}`,
        oldStatus: item.status,
        newStatus: body.status as string,
      },
    }).catch(() => {})
  }

  return NextResponse.json(updated)
}
