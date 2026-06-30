import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getDb, osInvoices } from '@/lib/db'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  await requireAuth()
  const db = getDb()
  const companyId = req.nextUrl.searchParams.get('companyId')

  if (!companyId) {
    return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
  }

  try {
    const invoices = await db.select().from(osInvoices).where(eq(osInvoices.companyId, companyId))
    return NextResponse.json(invoices)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  await requireAuth()
  const db = getDb()
  let body: { companyId: string; invoiceNumber: string; amount: number; currency?: string; status?: string; issueDate: string; dueDate?: string; paidAt?: string; notes?: string }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { companyId, invoiceNumber, amount, currency, status, issueDate, dueDate, paidAt, notes } = body

  if (!companyId?.trim()) return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
  if (!invoiceNumber?.trim()) return NextResponse.json({ error: 'invoiceNumber is required' }, { status: 400 })
  if (amount === undefined || amount === null) return NextResponse.json({ error: 'amount is required' }, { status: 400 })
  if (!issueDate) return NextResponse.json({ error: 'issueDate is required' }, { status: 400 })

  try {
    const invoice = await db.insert(osInvoices).values({
      companyId,
      invoiceNumber,
      amount,
      currency: currency || 'USD',
      status: status || 'Draft',
      issueDate: new Date(issueDate),
      dueDate: dueDate ? new Date(dueDate) : null,
      paidAt: paidAt ? new Date(paidAt) : null,
      notes: notes || null,
    }).returning()

    return NextResponse.json(invoice[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}
