import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import type { DraftRecord } from '@/lib/voice/types'
import { WorkItemType, Priority } from '@prisma/client'
import { isValidType, isValidPriority } from '@/lib/work-item-enums'
import { dispatchAlerts } from '@/lib/alert-dispatch'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, draft } = (await req.json().catch(() => ({}))) as { id?: string; draft?: DraftRecord }
  if (!id || !draft) return NextResponse.json({ error: 'id and draft required' }, { status: 400 })

  // Scope to the creator so one user cannot approve another's intake.
  const intake = await db.voiceIntake.findFirst({ where: { id, createdBy: session.person } })
  if (!intake) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (intake.status === 'APPROVED') {
    return NextResponse.json({ error: 'Already approved' }, { status: 409 })
  }

  if (!draft.title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 })

  // Validate enums up front: an invalid value would otherwise surface as an
  // opaque Prisma 500. Fall back to safe defaults rather than rejecting.
  const type: WorkItemType = isValidType(draft.type) ? (draft.type as WorkItemType) : 'InternalTask'
  const priority: Priority = isValidPriority(draft.priority) ? (draft.priority as Priority) : 'Medium'

  let workItem
  try {
    // Create the work item, log it, mark the intake approved, and drop the now
    // redundant audio blob — all atomically so a retry can't duplicate the item.
    workItem = await db.$transaction(async (tx) => {
      const item = await tx.workItem.create({
        data: {
          title: draft.title.trim(),
          type,
          owner: draft.owner?.trim() || session.person,
          company: draft.company?.trim() || null,
          contactName: draft.contactName?.trim() || null,
          priority,
          nextAction: draft.nextAction?.trim() || null,
          dueDate: draft.dueDate ? new Date(draft.dueDate) : null,
          notes: draft.notes?.trim() || null,
          status: 'Captured',
        },
      })

      await tx.activityLog.create({
        data: {
          workItemId: item.id,
          person: session.person,
          eventType: 'Created',
          summary: `Created from voice intake by ${session.person}`,
          newStatus: 'Captured',
        },
      })

      await tx.voiceIntake.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: session.person,
          linkedWorkItemId: item.id,
          audioData: null,
        },
      })

      return item
    })
  } catch {
    return NextResponse.json({ error: 'Could not create work item. Please try again.' }, { status: 503 })
  }

  // Mirror the canonical create path: compliance alerts trigger recipient
  // dispatch. Fire-and-forget so a dispatch error never fails the approval.
  if (workItem.type === 'ComplianceAlert') {
    dispatchAlerts(workItem).catch((err) => console.error('[AlertDispatch] error:', err))
  }

  return NextResponse.json({ workItemId: workItem.id }, { status: 201 })
}
