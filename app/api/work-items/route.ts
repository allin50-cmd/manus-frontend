import { NextRequest, NextResponse } from 'next/server'
import { getDb, workItems, activityLogs } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { eq, asc, desc } from 'drizzle-orm'
import { trackEvent } from '@/lib/ut-tracker'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const type = searchParams.get('type')
  const owner = searchParams.get('owner')
  const priority = searchParams.get('priority')

  const db = await getDb()

  const conditions = []
  if (status && status !== 'all') conditions.push(eq(workItems.status, status as typeof workItems.status._.data))
  if (type && type !== 'all') conditions.push(eq(workItems.type, type as typeof workItems.type._.data))
  if (owner && owner !== 'all') conditions.push(eq(workItems.owner, owner))
  if (priority && priority !== 'all') conditions.push(eq(workItems.priority, priority as typeof workItems.priority._.data))

  const { and } = await import('drizzle-orm')
  const items = await db
    .select()
    .from(workItems)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(workItems.priority), asc(workItems.dueDate), desc(workItems.createdAt))

  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  if (!body.title || !body.type || !body.owner) {
    return NextResponse.json({ error: 'title, type and owner are required' }, { status: 400 })
  }

  const db = await getDb()

  const [item] = await db.insert(workItems).values({
    type: body.type,
    title: body.title,
    company: body.company || null,
    contactName: body.contactName || null,
    owner: body.owner,
    status: body.status || 'Captured',
    priority: body.priority || 'Medium',
    nextAction: body.nextAction || null,
    dueDate: body.dueDate ? new Date(body.dueDate) : null,
    decisionNeeded: body.decisionNeeded ?? false,
    notes: body.notes || null,
  }).returning()

  await db.insert(activityLogs).values({
    workItemId: item.id,
    person: session.person,
    eventType: 'Created',
    summary: `Work item "${item.title}" created`,
    newStatus: item.status,
  })

  await trackEvent({ eventType: 'task_created', userId: session.person })
  return NextResponse.json(item, { status: 201 })
}
