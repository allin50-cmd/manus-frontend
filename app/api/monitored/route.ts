import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { monitoredCompanies } from '@/db/schema'
import { getSession } from '@/lib/auth'
import { desc, eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  const items = await db
    .select()
    .from(monitoredCompanies)
    .orderBy(desc(monitoredCompanies.activatedAt))

  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const companyNumber = String(body.companyNumber ?? '').trim()
  const companyName = String(body.companyName ?? '').trim()

  if (!companyNumber || !companyName) {
    return NextResponse.json(
      { error: 'companyNumber and companyName are required' },
      { status: 400 },
    )
  }

  const db = await getDb()

  // Idempotent: if already monitored, return the existing record.
  const [existing] = await db
    .select()
    .from(monitoredCompanies)
    .where(eq(monitoredCompanies.companyNumber, companyNumber))
    .limit(1)

  if (existing) {
    return NextResponse.json(existing, { status: 200 })
  }

  // stripeSessionId is required by the schema. Until Stripe checkout is wired,
  // mark activation as "manual" so the row is valid and the source is auditable.
  const [created] = await db
    .insert(monitoredCompanies)
    .values({
      companyNumber,
      companyName,
      stripeSessionId: typeof body.stripeSessionId === 'string' ? body.stripeSessionId : 'manual',
    })
    .returning()

  return NextResponse.json(created, { status: 201 })
}
