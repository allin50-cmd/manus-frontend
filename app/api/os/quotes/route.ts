import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getDb, osQuotes } from '@/lib/db'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  await requireAuth()
  const db = getDb()
  const companyId = req.nextUrl.searchParams.get('companyId')

  if (!companyId) {
    return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
  }

  try {
    const quotes = await db.select().from(osQuotes).where(eq(osQuotes.companyId, companyId))
    return NextResponse.json(quotes)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  await requireAuth()
  const db = getDb()
  let body: { companyId: string; quoteNumber: string; amount: number; currency?: string; status?: string; issueDate: string; expiryDate?: string; notes?: string }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { companyId, quoteNumber, amount, currency, status, issueDate, expiryDate, notes } = body

  if (!companyId?.trim()) return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
  if (!quoteNumber?.trim()) return NextResponse.json({ error: 'quoteNumber is required' }, { status: 400 })
  if (amount === undefined || amount === null) return NextResponse.json({ error: 'amount is required' }, { status: 400 })
  if (!issueDate) return NextResponse.json({ error: 'issueDate is required' }, { status: 400 })

  try {
    const quote = await db.insert(osQuotes).values({
      companyId,
      quoteNumber,
      amount,
      currency: currency || 'USD',
      status: status || 'Draft',
      issueDate: new Date(issueDate),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      notes: notes || null,
    }).returning()

    return NextResponse.json(quote[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create quote' }, { status: 500 })
  }
}
