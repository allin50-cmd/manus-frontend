import { NextRequest, NextResponse } from 'next/server'
import { getDb, osTasks } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { eq } from 'drizzle-orm'
import { trackEvent } from '@/lib/ut-tracker'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  const [existing] = await db.select().from(osTasks).where(eq(osTasks.id, params.id)).limit(1)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
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
