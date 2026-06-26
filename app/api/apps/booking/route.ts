import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { osTasks } from '@/db/schema'
import { trackEvent } from '@/lib/ut-tracker'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })

  const { customerName, customerContact, date, time, location, notes } = body
  if (!customerName || typeof customerName !== 'string') {
    return NextResponse.json({ error: 'customerName is required' }, { status: 400 })
  }
  if (!date || typeof date !== 'string') {
    return NextResponse.json({ error: 'date is required' }, { status: 400 })
  }

  let dueAt: Date | null = null
  try {
    const dt = time ? `${date}T${time}:00` : `${date}T09:00:00`
    dueAt = new Date(dt)
    if (isNaN(dueAt.getTime())) dueAt = null
  } catch {
    dueAt = null
  }

  const fullNotes = [
    `Customer: ${customerName.trim()}`,
    customerContact ? `Contact: ${customerContact.trim()}` : null,
    location ? `Location: ${location.trim()}` : null,
    notes && typeof notes === 'string' ? notes.trim() : null,
    `Submitted via /apps/booking`,
    // TODO: Add travel time, maps, parking, and route optimisation
  ].filter(Boolean).join('\n')

  try {
    const db = await getDb()
    const [task] = await db
      .insert(osTasks)
      .values({
        title: `Appointment: ${customerName.trim()} — ${date}${time ? ` at ${time}` : ''}`,
        assignedTo: 'George',
        priority: 'Medium',
        status: 'Open',
        dueAt,
        notes: fullNotes,
      })
      .returning()

    void trackEvent({
      eventType: 'app_submitted',
      metadata: { app: 'booking', date },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (err) {
    console.error('[apps/booking] DB error:', err)
    return NextResponse.json({ error: 'Failed to save booking. Please try again.' }, { status: 500 })
  }
}
