import { NextRequest, NextResponse } from 'next/server'
import { getDb, osInvoices } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  const [invoice] = await db.select().from(osInvoices).where(eq(osInvoices.id, params.id)).limit(1)

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  return NextResponse.json(invoice)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.clientName) return NextResponse.json({ error: 'clientName is required' }, { status: 400 })
  if (body.amountPence === undefined) return NextResponse.json({ error: 'amountPence is required' }, { status: 400 })

  const db = await getDb()

  const [invoice] = await db
    .update(osInvoices)
    .set({
      clientName: body.clientName,
      clientEmail: body.clientEmail || null,
      description: body.description || null,
      amountPence: body.amountPence,
      status: body.status || 'Draft',
      issuedAt: body.issuedAt ? new Date(body.issuedAt) : null,
      dueAt: body.dueAt ? new Date(body.dueAt) : null,
      linkedWorkItemId: body.linkedWorkItemId || null,
      notes: body.notes || null,
      updatedAt: new Date(),
    })
    .where(eq(osInvoices.id, params.id))
    .returning()

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  return NextResponse.json(invoice)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  const [invoice] = await db.delete(osInvoices).where(eq(osInvoices.id, params.id)).returning()

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
