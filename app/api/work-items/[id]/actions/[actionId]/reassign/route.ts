import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export const runtime = 'nodejs'

const VALID_PERSONS = ['George', 'Dagon', 'Alissa', 'Michelle', 'Chris', 'Charlie'] as const

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; actionId: string } },
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const assignedTo = body.assignedTo as string
  if (!assignedTo || !(VALID_PERSONS as readonly string[]).includes(assignedTo)) {
    return NextResponse.json(
      { error: `assignedTo must be one of: ${VALID_PERSONS.join(', ')}` },
      { status: 400 },
    )
  }

  const handoffNote = (body.handoffNote as string | undefined) ?? undefined

  let action
  try {
    action = await db.action.findUnique({ where: { id: params.actionId } })
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  if (!action || action.workItemId !== params.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const oldAssignee = action.assignedTo ?? 'Unassigned'
  const noteText = handoffNote ? ` ${handoffNote}` : ''
  const summary = `Reassigned action '${action.label}' from ${oldAssignee} to ${assignedTo}.${noteText}`

  let updated
  try {
    updated = await db.$transaction(async (tx) => {
      const u = await tx.action.update({
        where: { id: params.actionId },
        data: {
          assignedTo,
          reassignedFrom: oldAssignee,
          reassignedAt: new Date(),
          reassignedBy: session.person,
          handoffNote: handoffNote ?? null,
        },
      })

      await tx.activityLog.create({
        data: {
          workItemId: params.id,
          actionId: params.actionId,
          person: session.person,
          eventType: 'NoteAdded',
          summary,
        },
      })

      return u
    })
  } catch {
    return NextResponse.json({ error: 'Could not reassign action' }, { status: 503 })
  }

  return NextResponse.json(updated)
}
