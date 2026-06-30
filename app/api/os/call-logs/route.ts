import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getDb, osCallLogs } from '@/lib/db'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  await requireAuth()
  const db = getDb()
  const companyId = req.nextUrl.searchParams.get('companyId')

  if (!companyId) {
    return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
  }

  try {
    const logs = await db.select().from(osCallLogs).where(eq(osCallLogs.companyId, companyId))
    return NextResponse.json(logs)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch call logs' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  await requireAuth()
  const db = getDb()
  let body: { companyId: string; personId?: string; direction: string; duration?: number; transcript?: string; notes?: string; recordedAt: string }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { companyId, personId, direction, duration, transcript, notes, recordedAt } = body

  if (!companyId?.trim()) return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
  if (!direction?.trim()) return NextResponse.json({ error: 'direction is required' }, { status: 400 })
  if (!recordedAt) return NextResponse.json({ error: 'recordedAt is required' }, { status: 400 })

  try {
    const log = await db.insert(osCallLogs).values({
      companyId,
      personId: personId || null,
      direction,
      duration: duration || null,
      transcript: transcript || null,
      notes: notes || null,
      recordedAt: new Date(recordedAt),
    }).returning()

    return NextResponse.json(log[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create call log' }, { status: 500 })
  }
}
