import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { ActionType } from '@/lib/types'

const VALID_ACTION_TYPES: ActionType[] = [
  'LogNote', 'CreateFollowUp', 'ChangeStatus', 'DraftMessage',
  'EscalateToGeorge', 'GenerateDocument', 'MarkComplete', 'Archive', 'Other',
]

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let item
  try {
    item = await db.workItem.findUnique({ where: { id: params.id } })
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.label) return NextResponse.json({ error: 'label required' }, { status: 400 })

  const actionType: ActionType = VALID_ACTION_TYPES.includes(body.actionType as ActionType)
    ? (body.actionType as ActionType)
    : 'CreateFollowUp'

  const dueDate = body.dueDate ? new Date(body.dueDate as string) : null

  try {
    const action = await db.$transaction(async (tx) => {
      const created = await tx.action.create({
        data: {
          workItemId: item.id,
          actionType,
          label: body.label as string,
          assignedTo: (body.assignedTo as string) || session.person,
          dueDate,
        },
      })

      await tx.activityLog.create({
        data: {
          workItemId: item.id,
          actionId: created.id,
          person: session.person,
          eventType: 'ActionCreated',
          summary: `Follow-up created: ${body.label}`,
        },
      })

      if (dueDate) {
        await tx.workItem.update({
          where: { id: item.id },
          data: { nextAction: body.label as string, dueDate },
        })
        await tx.activityLog.create({
          data: {
            workItemId: item.id,
            person: session.person,
            eventType: 'FollowUpSet',
            summary: `Follow-up set: ${body.label} due ${body.dueDate}`,
          },
        })
      }

      return created
    })

    return NextResponse.json(action, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Could not create action' }, { status: 503 })
  }
}
