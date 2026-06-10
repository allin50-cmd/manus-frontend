import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import type { DraftRecord } from '@/lib/voice/types'
import { WorkItemType, Priority } from '@prisma/client'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, draft } = await req.json() as { id: string; draft: DraftRecord }
  if (!id || !draft) return NextResponse.json({ error: 'id and draft required' }, { status: 400 })

  const intake = await db.voiceIntake.findUnique({ where: { id } })
  if (!intake) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (intake.status === 'APPROVED') {
    return NextResponse.json({ error: 'Already approved' }, { status: 409 })
  }

  if (!draft.title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 })

  const workItem = await db.workItem.create({
    data: {
      title: draft.title.trim(),
      type: (draft.type as WorkItemType) || 'InternalTask',
      owner: draft.owner || session.person,
      company: draft.company || null,
      contactName: draft.contactName || null,
      priority: (draft.priority as Priority) || 'Medium',
      nextAction: draft.nextAction || null,
      dueDate: draft.dueDate ? new Date(draft.dueDate) : null,
      notes: draft.notes || null,
      status: 'Captured',
    },
  })

  await db.activityLog.create({
    data: {
      workItemId: workItem.id,
      person: session.person,
      eventType: 'Created',
      summary: `Created from voice intake by ${session.person}`,
      newStatus: 'Captured',
    },
  })

  await db.voiceIntake.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: session.person,
      linkedWorkItemId: workItem.id,
    },
  })

  return NextResponse.json({ workItemId: workItem.id }, { status: 201 })
}
