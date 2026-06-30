import { NextRequest, NextResponse } from 'next/server'
import { getDb, osAlerts } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()

  const [alert] = await db
    .update(osAlerts)
    .set({
      isRead: true,
    })
    .where(eq(osAlerts.id, params.id))
    .returning()

  if (!alert) {
    return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
  }

  return NextResponse.json(alert)
}
