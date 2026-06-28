import { NextRequest, NextResponse } from 'next/server'
import { getDb, osAlerts } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { desc } from 'drizzle-orm'
import { trackEvent } from '@/lib/ut-tracker'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  const alerts = await db.select().from(osAlerts).orderBy(desc(osAlerts.createdAt)).limit(100)
  return NextResponse.json(alerts)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  const db = await getDb()
  const [alert] = await db
    .insert(osAlerts)
    .values({
      severity: body.severity || 'Info',
      title: body.title,
      body: body.body || null,
      source: body.source || null,
      // TODO: require callers to pass companyId once all clients are updated
      companyId: body.companyId || null,
      linkedWorkItemId: body.linkedWorkItemId || null,
    })
    .returning()

  await trackEvent({ eventType: 'alert_generated', userId: session.person })
  return NextResponse.json(alert, { status: 201 })
}
