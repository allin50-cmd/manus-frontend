import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { WorkItemStatus, WorkItemType, Priority } from '@/lib/types'
import { dispatchAlerts } from '@/lib/alert-dispatch'
import { isValidType, isValidStatus, isValidPriority } from '@/lib/work-item-enums'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const where: Record<string, unknown> = {}
  const status = searchParams.get('status')
  const type = searchParams.get('type')
  const owner = searchParams.get('owner')
  const priority = searchParams.get('priority')
  const company = searchParams.get('company')

  // Validate enums before passing to Prisma to avoid P2009 uncaught errors.
  if (status && status !== 'all') {
    if (!isValidStatus(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    where.status = status as WorkItemStatus
  }
  if (type && type !== 'all') {
    if (!isValidType(type)) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    where.type = type as WorkItemType
  }
  if (owner && owner !== 'all') where.owner = owner
  if (priority && priority !== 'all') {
    if (!isValidPriority(priority)) return NextResponse.json({ error: 'Invalid priority' }, { status: 400 })
    where.priority = priority as Priority
  }
  if (company) where.company = company

  try {
    const items = await db.workItem.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json(items)
  } catch {
    return NextResponse.json({ error: 'Could not load work items' }, { status: 503 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (!title || !body.type || !body.owner) {
    return NextResponse.json({ error: 'title, type and owner are required' }, { status: 400 })
  }
  if (!isValidType(body.type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }
  if (body.status && !isValidStatus(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  if (body.priority && !isValidPriority(body.priority)) {
    return NextResponse.json({ error: 'Invalid priority' }, { status: 400 })
  }

  let item
  try {
    item = await db.workItem.create({
      data: {
        type: body.type as WorkItemType,
        title,
        company: (body.company as string) || null,
        contactName: (body.contactName as string) || null,
        owner: body.owner as string,
        status: (body.status as WorkItemStatus) || 'Captured',
        priority: (body.priority as Priority) || 'Medium',
        nextAction: (body.nextAction as string) || null,
        dueDate: body.dueDate ? new Date(body.dueDate as string) : null,
        decisionNeeded: (body.decisionNeeded as boolean) ?? false,
        notes: (body.notes as string) || null,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Could not create work item' }, { status: 503 })
  }

  // Keep Company table in sync with free-text company field
  if (item.company) {
    db.company.upsert({
      where: { name: item.company },
      create: { name: item.company },
      update: {},
    }).catch(() => {})
  }

  await db.activityLog.create({
    data: {
      workItemId: item.id,
      person: session.person,
      eventType: 'Created',
      summary: `Work item "${item.title}" created`,
      newStatus: item.status,
    },
  }).catch(() => {})

  if (item.type === 'ComplianceAlert') {
    dispatchAlerts(item).catch((err) => console.error('[AlertDispatch] error:', err))
  }

  return NextResponse.json(item, { status: 201 })
}
