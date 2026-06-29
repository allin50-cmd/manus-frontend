import { NextRequest, NextResponse } from 'next/server'
import { getDb, osTasks } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { eq } from 'drizzle-orm'
import { trackEvent } from '@/lib/ut-tracker'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  const [task] = await db.select().from(osTasks).where(eq(osTasks.id, params.id)).limit(1)

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  return NextResponse.json(task)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  const db = await getDb()

  const [task] = await db
    .update(osTasks)
    .set({
      title: body.title,
      priority: body.priority || 'Medium',
      status: body.status || 'Open',
      assignedTo: body.assignedTo || session.person,
      dueAt: body.dueAt ? new Date(body.dueAt) : null,
      linkedWorkItemId: body.linkedWorkItemId || null,
      notes: body.notes || null,
      updatedAt: new Date(),
    })
    .where(eq(osTasks.id, params.id))
    .returning()

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  return NextResponse.json(task)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  const [existing] = await db.select().from(osTasks).where(eq(osTasks.id, params.id)).limit(1)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()

  const VALID_STATUS = ['Open', 'InProgress', 'Done', 'Cancelled'] as const
  const VALID_PRIORITY = ['Low', 'Medium', 'High', 'Urgent'] as const
  if (body.status !== undefined && !VALID_STATUS.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  if (body.priority !== undefined && !VALID_PRIORITY.includes(body.priority)) {
    return NextResponse.json({ error: 'Invalid priority' }, { status: 400 })
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (body.title !== undefined) updates.title = body.title
  if (body.assignedTo !== undefined) updates.assignedTo = body.assignedTo
  if (body.priority !== undefined) updates.priority = body.priority
  if (body.status !== undefined) updates.status = body.status
  if (body.dueAt !== undefined) updates.dueAt = body.dueAt ? new Date(body.dueAt) : null
  if (body.notes !== undefined) updates.notes = body.notes

  const [updated] = await db
    .update(osTasks)
    .set(updates)
    .where(eq(osTasks.id, params.id))
    .returning()

  if (body.status === 'Done' && existing.status !== 'Done') {
    await trackEvent({ eventType: 'task_completed', userId: session.person })
  }

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  await db.delete(osTasks).where(eq(osTasks.id, params.id))
  return NextResponse.json({ success: true })
}
