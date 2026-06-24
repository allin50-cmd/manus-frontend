import { NextRequest, NextResponse } from 'next/server'
import { getDb, osAlerts } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { eq } from 'drizzle-orm'
import { trackEvent } from '@/lib/ut-tracker'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  const [existing] = await db.select().from(osAlerts).where(eq(osAlerts.id, params.id)).limit(1)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const updates: Record<string, unknown> = {}
  if (body.isRead !== undefined) updates.isRead = body.isRead
  if (body.resolvedAt !== undefined) updates.resolvedAt = body.resolvedAt ? new Date(body.resolvedAt) : null

  const [updated] = await db
    .update(osAlerts)
    .set(updates)
    .where(eq(osAlerts.id, params.id))
    .returning()

  // Acknowledge = marking as read when it wasn't before
  if (body.isRead === true && !existing.isRead) {
    await trackEvent({ eventType: 'alert_acknowledged', userId: session.person })
  }

  return NextResponse.json(updated)
}
