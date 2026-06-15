import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { OutreachChannel, OutreachDirection } from '@prisma/client'

export const runtime = 'nodejs'

const VALID_CHANNELS = Object.values(OutreachChannel)
const VALID_DIRECTIONS = Object.values(OutreachDirection)

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { channel, direction, summary, occurredAt, contactId, contactName, followUpDate } = body

  if (typeof channel !== 'string' || !VALID_CHANNELS.includes(channel as OutreachChannel)) {
    return NextResponse.json({ error: 'Invalid channel' }, { status: 400 })
  }
  if (typeof direction !== 'string' || !VALID_DIRECTIONS.includes(direction as OutreachDirection)) {
    return NextResponse.json({ error: 'Invalid direction' }, { status: 400 })
  }
  if (typeof summary !== 'string' || !summary.trim()) {
    return NextResponse.json({ error: 'summary is required' }, { status: 400 })
  }
  if (!occurredAt) {
    return NextResponse.json({ error: 'occurredAt is required' }, { status: 400 })
  }

  const parsedOccurredAt = new Date(occurredAt as string)
  if (isNaN(parsedOccurredAt.getTime())) {
    return NextResponse.json({ error: 'Invalid occurredAt date' }, { status: 400 })
  }

  let parsedFollowUpDate: Date | null = null
  if (followUpDate) {
    parsedFollowUpDate = new Date(followUpDate as string)
    if (isNaN(parsedFollowUpDate.getTime())) {
      return NextResponse.json({ error: 'Invalid followUpDate' }, { status: 400 })
    }
  }

  // Verify work item exists
  try {
    const item = await db.workItem.findUnique({ where: { id: params.id } })
    if (!item) return NextResponse.json({ error: 'Work item not found' }, { status: 404 })
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  let log
  try {
    log = await db.outreachLog.create({
      data: {
        workItemId: params.id,
        channel: channel as OutreachChannel,
        direction: direction as OutreachDirection,
        summary: summary.trim(),
        loggedBy: session.person,
        occurredAt: parsedOccurredAt,
        contactId: typeof contactId === 'string' ? contactId : null,
        contactName: typeof contactName === 'string' ? contactName.trim() || null : null,
        followUpDate: parsedFollowUpDate,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Could not create outreach log' }, { status: 503 })
  }

  return NextResponse.json(log, { status: 201 })
}
