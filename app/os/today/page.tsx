import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { OWNERS } from '@/lib/work-item-enums'
import type { WorkItemStatus } from '@/lib/types'
import TodayWorkspace from './TodayWorkspace'

export const dynamic = 'force-dynamic'

export default async function TodayWorkspacePage() {
  const session = await requireAuth()

  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const endOfToday = new Date(now)
  endOfToday.setHours(23, 59, 59, 999)

  const nonFinal = { notIn: ['Completed', 'Archived', 'NotFit'] as WorkItemStatus[] }

  let data
  try {
    const [
      jobsDueToday,
      overdueWorkItems,
      blockedActions,
      myActions,
      pendingDecisions,
      scheduledItems,
      openActionsForCapacity,
    ] = await Promise.all([
      db.workItem.findMany({
        where: { dueDate: { gte: startOfToday, lte: endOfToday }, status: nonFinal },
        orderBy: { dueDate: 'asc' },
        take: 50,
      }),
      db.workItem.findMany({
        where: { dueDate: { lt: startOfToday }, status: nonFinal },
        orderBy: { dueDate: 'asc' },
        take: 50,
      }),
      db.action.findMany({
        where: { status: 'Blocked' },
        include: { workItem: { select: { id: true, title: true } } },
        orderBy: { dueDate: 'asc' },
        take: 50,
      }),
      db.action.findMany({
        where: { assignedTo: session.person, status: 'Open' },
        include: { workItem: { select: { id: true, title: true } } },
        orderBy: { dueDate: 'asc' },
        take: 50,
      }),
      db.decision.findMany({
        where: { status: { in: ['Open', 'MoreInfoNeeded', 'Paused'] } },
        include: { workItem: { select: { id: true, title: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      db.workItem.findMany({
        where: { status: { in: ['Captured', 'Controlled'] } },
        select: { id: true, title: true, dueDate: true },
        orderBy: { dueDate: 'asc' },
        take: 100,
      }),
      db.action.findMany({
        where: { assignedTo: { in: [...OWNERS] }, status: { in: ['Open', 'Blocked'] } },
        select: { assignedTo: true, status: true },
      }),
    ])

    const teamWorkload = OWNERS.map((name) => {
      const mine = openActionsForCapacity.filter((a) => a.assignedTo === name)
      return {
        id: name,
        name,
        activeTasksCount: mine.filter((a) => a.status === 'Open').length,
        blockedTasksCount: mine.filter((a) => a.status === 'Blocked').length,
      }
    })

    data = {
      jobsDueToday: jobsDueToday.map(serializeWorkItem),
      overdueWorkItems: overdueWorkItems.map(serializeWorkItem),
      blockedTasks: blockedActions.map(serializeAction),
      myTasks: myActions.map(serializeAction),
      pendingDecisions: pendingDecisions.map((d) => ({
        id: d.id,
        title: d.question,
        workItemId: d.workItem.id,
        status: d.status,
        createdAt: d.createdAt.toISOString(),
      })),
      scheduledItems: scheduledItems.map((i) => ({
        id: i.id,
        title: i.title,
        due_at: i.dueDate ? i.dueDate.toISOString() : null,
      })),
      teamWorkload,
    }
  } catch {
    data = null
  }

  return <TodayWorkspace initialData={data} />
}

function serializeWorkItem(item: {
  id: string
  title: string
  status: string
  priority: string
  dueDate: Date | null
}) {
  return {
    id: item.id,
    title: item.title,
    status: item.status,
    priority: item.priority,
    due_at: item.dueDate ? item.dueDate.toISOString() : null,
  }
}

function serializeAction(action: {
  id: string
  label: string
  status: string
  dueDate: Date | null
  workItem: { id: string; title: string }
}) {
  return {
    id: action.id,
    title: action.label,
    status: action.status,
    priority: 'Medium',
    due_at: action.dueDate ? action.dueDate.toISOString() : null,
    work_item_id: action.workItem.id,
  }
}
