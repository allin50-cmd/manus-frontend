import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { WorkItemStatus, WorkItemType, Priority } from '@prisma/client'
import { dispatchAlerts } from '@/lib/alert-dispatch'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const where: Record<string, unknown> = {}
  const status = searchParams.get('status')
  const type = searchParams.get('type')
  const owner = searchParams.get('owner')
  const priority = searchParams.get('priority')

  if (status && status !== 'all') where.status = status as WorkItemStatus
  if (type && type !== 'all') where.type = type as WorkItemType
  if (owner && owner !== 'all') where.owner = owner
  if (priority && priority !== 'all') where.priority = priority as Priority

  const items = await db.workItem.findMany({
    where,
    orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  if (!body.title || !body.type || !body.owner) {
    return NextResponse.json({ error: 'title, type and owner are required' }, { status: 400 })
  }

  const item = await db.workItem.create({
    data: {
      type: body.type as WorkItemType,
      title: body.title,
      company: body.company || null,
      contactName: body.contactName || null,
      owner: body.owner,
      status: (body.status as WorkItemStatus) || 'Captured',
      priority: (body.priority as Priority) || 'Medium',
      nextAction: body.nextAction || null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      decisionNeeded: body.decisionNeeded ?? false,
      notes: body.notes || null,
    },
  })

  await db.activityLog.create({
    data: {
      workItemId: item.id,
      person: session.person,
      eventType: 'Created',
      summary: `Work item "${item.title}" created`,
      newStatus: item.status,
    },
  })

  // Dispatch alert notifications for compliance alerts (fire-and-forget)
  if (item.type === 'ComplianceAlert') {
    dispatchAlerts(item).catch((err) => console.error('[AlertDispatch] error:', err))
  }

  return NextResponse.json(item, { status: 201 })
}
