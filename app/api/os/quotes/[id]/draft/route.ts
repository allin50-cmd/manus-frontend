import { NextRequest, NextResponse } from 'next/server'
import { getDb, osQuotes } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()

  const [quote] = await db
    .update(osQuotes)
    .set({
      status: 'Draft',
      updatedAt: new Date(),
    })
    .where(eq(osQuotes.id, params.id))
    .returning()

  if (!quote) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  }

  return NextResponse.json(quote)
}
