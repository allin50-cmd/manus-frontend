import { db } from '../db'
import type { WorkItemStatus, Priority } from '@prisma/client'

const TERMINAL_STATUSES: WorkItemStatus[] = ['Completed', 'Archived', 'NotFit']

export type BriefingItem = {
  id: string
  title: string
  company: string | null
  owner: string
  status: WorkItemStatus
  priority: Priority
  dueDate: Date | null
  nextAction: string | null
}

/**
 * Returns work items for George's morning briefing:
 * - Items owned by George that are NOT in terminal statuses (Completed, Archived, NotFit)
 * - Items with status DecisionNeeded (regardless of owner)
 * - Items with status Escalated (regardless of owner)
 * Sorted by priority DESC, then dueDate ASC NULLS LAST
 */
export async function getBriefingItems(): Promise<BriefingItem[]> {
  const items = await db.workItem.findMany({
    where: {
      OR: [
        { owner: 'George', status: { notIn: TERMINAL_STATUSES } },
        { status: 'DecisionNeeded' },
        { status: 'Escalated' },
      ],
    },
    select: {
      id: true,
      title: true,
      company: true,
      owner: true,
      status: true,
      priority: true,
      dueDate: true,
      nextAction: true,
    },
    orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
  })

  return items
}

/**
 * A work item is "overdue" if dueDate < today and status is not terminal
 */
export function isOverdue(item: { dueDate: Date | null; status: string }): boolean {
  if (!item.dueDate) return false
  if (TERMINAL_STATUSES.includes(item.status as WorkItemStatus)) return false
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  return new Date(item.dueDate) < startOfToday
}

/**
 * Returns end of today as a Date
 */
export function endOfToday(): Date {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d
}
