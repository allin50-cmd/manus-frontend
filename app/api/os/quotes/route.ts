import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { osQuotes } from '@/db/schema'
import { getSession } from '@/lib/auth'
import { desc } from 'drizzle-orm'
import { trackEvent } from '@/lib/ut-tracker'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  const quotes = await db.select().from(osQuotes).orderBy(desc(osQuotes.createdAt)).limit(100)
  return NextResponse.json(quotes)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.clientName || !body.number) {
    return NextResponse.json({ error: 'clientName and number are required' }, { status: 400 })
  }

  const db = await getDb()
  const [quote] = await db
    .insert(osQuotes)
    .values({
      number: body.number,
      clientName: body.clientName,
      clientEmail: body.clientEmail || null,
      description: body.description || null,
      amountPence: body.amountPence ?? 0,
      status: body.status || 'Draft',
      validUntil: body.validUntil ? new Date(body.validUntil) : null,
      linkedWorkItemId: body.linkedWorkItemId || null,
      notes: body.notes || null,
    })
    .returning()

  await trackEvent({ eventType: 'quote_created', userId: session.person })
  return NextResponse.json(quote, { status: 201 })
}
