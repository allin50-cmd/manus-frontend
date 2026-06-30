import { NextRequest, NextResponse } from 'next/server'
import { getDb, osQuotes } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  const [quote] = await db.select().from(osQuotes).where(eq(osQuotes.id, params.id)).limit(1)

  if (!quote) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  }

  return NextResponse.json(quote)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.clientName) return NextResponse.json({ error: 'clientName is required' }, { status: 400 })
  if (body.amountPence === undefined) return NextResponse.json({ error: 'amountPence is required' }, { status: 400 })

  const db = await getDb()

  const [quote] = await db
    .update(osQuotes)
    .set({
      clientName: body.clientName,
      clientEmail: body.clientEmail || null,
      description: body.description || null,
      amountPence: body.amountPence,
      status: body.status || 'Draft',
      validUntil: body.validUntil ? new Date(body.validUntil) : null,
      linkedWorkItemId: body.linkedWorkItemId || null,
      notes: body.notes || null,
      updatedAt: new Date(),
    })
    .where(eq(osQuotes.id, params.id))
    .returning()

  if (!quote) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  }

  return NextResponse.json(quote)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  const [quote] = await db.delete(osQuotes).where(eq(osQuotes.id, params.id)).returning()

  if (!quote) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
