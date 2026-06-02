import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { ActionType } from '@prisma/client'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const item = await db.workItem.findUnique({ where: { id: params.id } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  if (!body.label) return NextResponse.json({ error: 'label required' }, { status: 400 })

  const action = await db.action.create({
    data: {
      workItemId: item.id,
      actionType: (body.actionType as ActionType) || 'CreateFollowUp',
      label: body.label,
      assignedTo: body.assignedTo || session.person,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    },
  })

  await db.activityLog.create({
    data: {
      workItemId: item.id,
      actionId: action.id,
      person: session.person,
      eventType: 'ActionCreated',
      summary: `Follow-up created: ${body.label}`,
    },
  })

  if (body.dueDate) {
    await db.workItem.update({
      where: { id: item.id },
      data: { nextAction: body.label, dueDate: new Date(body.dueDate) },
    })
    await db.activityLog.create({
      data: {
        workItemId: item.id,
        person: session.person,
        eventType: 'FollowUpSet',
        summary: `Follow-up set: ${body.label} due ${body.dueDate}`,
      },
    })
  }

  return NextResponse.json(action, { status: 201 })
}
