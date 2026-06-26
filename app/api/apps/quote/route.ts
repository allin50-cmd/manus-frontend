import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { osQuotes } from '@/db/schema'
import { trackEvent } from '@/lib/ut-tracker'

export const dynamic = 'force-dynamic'

function generateQuoteNumber(): string {
  const now = new Date()
  const y = now.getUTCFullYear()
  const m = String(now.getUTCMonth() + 1).padStart(2, '0')
  const d = String(now.getUTCDate()).padStart(2, '0')
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `QB-${y}${m}${d}-${rand}`
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })

  const { customerName, customerContact, jobDescription, labourPence, materialsPence, notes } = body
  if (!customerName || typeof customerName !== 'string') {
    return NextResponse.json({ error: 'customerName is required' }, { status: 400 })
  }
  if (!jobDescription || typeof jobDescription !== 'string') {
    return NextResponse.json({ error: 'jobDescription is required' }, { status: 400 })
  }

  const labour = typeof labourPence === 'number' ? labourPence : 0
  const materials = typeof materialsPence === 'number' ? materialsPence : 0
  const totalPence = labour + materials

  const fullNotes = [
    notes && typeof notes === 'string' ? notes : null,
    `Labour: £${(labour / 100).toFixed(2)}`,
    `Materials: £${(materials / 100).toFixed(2)}`,
    `Contact: ${customerContact || 'not provided'}`,
    `Submitted via /apps/quote-builder`,
  ].filter(Boolean).join('\n')

  try {
    const db = await getDb()
    const [quote] = await db
      .insert(osQuotes)
      .values({
        number: generateQuoteNumber(),
        clientName: customerName.trim(),
        clientEmail: customerContact?.includes('@') ? customerContact.trim() : null,
        description: jobDescription.trim(),
        amountPence: totalPence,
        status: 'Draft',
        notes: fullNotes,
      })
      .returning()

    void trackEvent({
      eventType: 'app_submitted',
      metadata: { app: 'quote-builder', amountPence: totalPence },
    })

    return NextResponse.json(quote, { status: 201 })
  } catch (err) {
    console.error('[apps/quote] DB error:', err)
    return NextResponse.json({ error: 'Failed to save quote. Please try again.' }, { status: 500 })
  }
}
