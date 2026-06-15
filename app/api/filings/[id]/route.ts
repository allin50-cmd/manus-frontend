import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { FilingStatus } from '@prisma/client'

export const runtime = 'nodejs'

const VALID_STATUSES = new Set<string>(Object.values(FilingStatus))

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  let filing
  try {
    filing = await db.filing.findUnique({
      where: { id: params.id },
      include: {
        company: { select: { id: true, name: true } },
        workItem: true,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  if (!filing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(filing)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let filing
  try {
    filing = await db.filing.findUnique({ where: { id: params.id } })
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
  if (!filing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (body.status !== undefined) {
    if (!VALID_STATUSES.has(body.status as string)) {
      return NextResponse.json({ error: `Invalid status: ${body.status}` }, { status: 400 })
    }
  }

  const updates: Record<string, unknown> = {}

  if (body.title !== undefined) updates.title = body.title
  if (body.status !== undefined) {
    updates.status = body.status as FilingStatus
    if (body.status === 'COMPLETED' && !filing.completedAt) {
      updates.completedAt = new Date()
    }
  }
  if (body.filedReference !== undefined) updates.filedReference = body.filedReference
  if (body.completedByPerson !== undefined) updates.completedByPerson = body.completedByPerson
  if (body.completedAt !== undefined) updates.completedAt = body.completedAt ? new Date(body.completedAt as string) : null
  if (body.description !== undefined) updates.description = body.description
  if (body.statutoryReference !== undefined) updates.statutoryReference = body.statutoryReference
  if (body.dueDate !== undefined) {
    const d = new Date(body.dueDate as string)
    if (isNaN(d.getTime())) return NextResponse.json({ error: 'Invalid dueDate' }, { status: 400 })
    updates.dueDate = d
  }
  if (body.periodStart !== undefined) updates.periodStart = body.periodStart ? new Date(body.periodStart as string) : null
  if (body.periodEnd !== undefined) updates.periodEnd = body.periodEnd ? new Date(body.periodEnd as string) : null
  if (body.isRecurring !== undefined) updates.isRecurring = body.isRecurring
  if (body.recurrenceRule !== undefined) updates.recurrenceRule = body.recurrenceRule
  if (body.suppressReminders !== undefined) updates.suppressReminders = body.suppressReminders
  if (body.workItemId !== undefined) updates.workItemId = body.workItemId

  let updated
  try {
    updated = await db.filing.update({
      where: { id: params.id },
      data: updates,
      include: {
        company: { select: { id: true, name: true } },
        workItem: true,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Could not update filing' }, { status: 503 })
  }

  return NextResponse.json(updated)
}
