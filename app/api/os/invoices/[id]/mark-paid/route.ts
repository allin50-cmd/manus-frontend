import { NextRequest, NextResponse } from 'next/server'
import { getDb, osInvoices } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()

  const [invoice] = await db
    .update(osInvoices)
    .set({
      status: 'Paid',
      paidAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(osInvoices.id, params.id))
    .returning()

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  return NextResponse.json(invoice)
}
