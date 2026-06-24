import { NextRequest, NextResponse } from 'next/server'
import { getDb, osInvoices } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { desc } from 'drizzle-orm'
import { trackEvent } from '@/lib/ut-tracker'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  const invoices = await db.select().from(osInvoices).orderBy(desc(osInvoices.createdAt)).limit(100)
  return NextResponse.json(invoices)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.clientName || !body.number) {
    return NextResponse.json({ error: 'clientName and number are required' }, { status: 400 })
  }

  const db = await getDb()
  const [invoice] = await db
    .insert(osInvoices)
    .values({
      number: body.number,
      clientName: body.clientName,
      clientEmail: body.clientEmail || null,
      description: body.description || null,
      amountPence: body.amountPence ?? 0,
      status: body.status || 'Draft',
      issuedAt: body.issuedAt ? new Date(body.issuedAt) : null,
      dueAt: body.dueAt ? new Date(body.dueAt) : null,
      linkedWorkItemId: body.linkedWorkItemId || null,
      notes: body.notes || null,
    })
    .returning()

  await trackEvent({ eventType: 'invoice_created', userId: session.person })
  return NextResponse.json(invoice, { status: 201 })
}
