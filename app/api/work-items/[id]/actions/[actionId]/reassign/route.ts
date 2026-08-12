import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { OWNERS } from '@/lib/work-item-enums'

const TERMINAL_ACTION_STATUSES = ['Done', 'Cancelled'] as const
const MAX_HANDOFF_NOTE_LENGTH = 1000

function isValidOwner(value: string): value is (typeof OWNERS)[number] {
  return OWNERS.includes(value as (typeof OWNERS)[number])
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; actionId: string } },
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { assignedTo, handoffNote } = body as {
    assignedTo?: unknown
    handoffNote?: unknown
  }

  if (typeof assignedTo !== 'string' || !isValidOwner(assignedTo)) {
    return NextResponse.json({ error: 'Invalid assignee' }, { status: 400 })
  }

  if (handoffNote !== undefined && typeof handoffNote !== 'string') {
    return NextResponse.json({ error: 'Invalid handoff note' }, { status: 400 })
  }

  const normalizedNote = typeof handoffNote === 'string' ? handoffNote.trim() : ''
  if (normalizedNote.length > MAX_HANDOFF_NOTE_LENGTH) {
    return NextResponse.json({ error: 'Handoff note is too long' }, { status: 400 })
  }

  let action
  try {
    action = await db.action.findUnique({ where: { id: params.actionId } })
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  if (!action || action.workItemId !== params.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (TERMINAL_ACTION_STATUSES.includes(action.status as (typeof TERMINAL_ACTION_STATUSES)[number])) {
    return NextResponse.json({ error: 'Completed or cancelled actions cannot be reassigned' }, { status: 409 })
  }

  if (action.assignedTo === assignedTo) {
    return NextResponse.json({ error: `Action is already assigned to ${assignedTo}` }, { status: 409 })
  }

  const reassignedAt = new Date()
  const previousAssignee = action.assignedTo ?? 'Unassigned'

  let updated
  try {
    updated = await db.$transaction(async (tx) => {
      const result = await tx.action.updateMany({
        where: {
          id: params.actionId,
          workItemId: params.id,
          assignedTo: action.assignedTo,
          status: { notIn: [...TERMINAL_ACTION_STATUSES] },
        },
        data: {
          assignedTo,
          reassignedFrom: action.assignedTo,
          reassignedAt,
          reassignedBy: session.person,
          handoffNote: normalizedNote || null,
        },
      })

      if (result.count !== 1) return null

      await tx.activityLog.create({
        data: {
          workItemId: params.id,
          actionId: params.actionId,
          person: session.person,
          eventType: 'NoteAdded',
          summary: `Action reassigned from ${previousAssignee} to ${assignedTo}${normalizedNote ? ` — ${normalizedNote}` : ''}`,
        },
      })

      return tx.action.findUniqueOrThrow({ where: { id: params.actionId } })
    })
  } catch {
    return NextResponse.json({ error: 'Could not reassign action' }, { status: 503 })
  }

  if (!updated) {
    return NextResponse.json({ error: 'Action changed before reassignment could be applied' }, { status: 409 })
  }

  return NextResponse.json(updated)
}
