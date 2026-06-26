import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { workItems } from '@/db/schema'
import { trackEvent } from '@/lib/ut-tracker'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })

  const { businessName, contactNumber, duties, fallbackEmail } = body
  if (!businessName || typeof businessName !== 'string') {
    return NextResponse.json({ error: 'businessName is required' }, { status: 400 })
  }
  if (!contactNumber || typeof contactNumber !== 'string') {
    return NextResponse.json({ error: 'contactNumber is required' }, { status: 400 })
  }

  const dutiesList = Array.isArray(duties) && duties.length > 0
    ? duties.join(', ')
    : 'take messages'

  const notes = [
    `Contact number: ${contactNumber}`,
    `Receptionist duties: ${dutiesList}`,
    fallbackEmail ? `Fallback email: ${fallbackEmail}` : null,
    `Submitted via /apps/receptionist`,
  ].filter(Boolean).join('\n')

  try {
    const db = await getDb()
    const [record] = await db
      .insert(workItems)
      .values({
        type: 'Other',
        title: `Receptionist Setup: ${businessName.trim()}`,
        company: businessName.trim(),
        owner: 'George',
        status: 'Captured',
        priority: 'Medium',
        notes,
      })
      .returning()

    void trackEvent({
      eventType: 'app_submitted',
      metadata: { app: 'receptionist', businessName },
    })

    return NextResponse.json({ id: record.id, title: record.title }, { status: 201 })
  } catch (err) {
    console.error('[apps/receptionist] DB error:', err)
    return NextResponse.json({ error: 'Failed to save setup. Please try again.' }, { status: 500 })
  }
}
