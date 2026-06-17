import { NextResponse } from 'next/server'
import { db } from '../../../lib/db'
import { getSession } from '../../../lib/auth'
import type { WorkItemStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

const OWNERS = ['Dagon', 'Alissa', 'Michelle', 'Chris', 'Charlie', 'George']

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const today = new Date(now); today.setHours(0, 0, 0, 0)
  const endOfToday = new Date(now); endOfToday.setHours(23, 59, 59, 999)
  const in7Days = new Date(today.getTime() + 7 * 86_400_000)
  const in30Days = new Date(today.getTime() + 30 * 86_400_000)
  const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - today.getDay())

  const nonFinal = { notIn: ['Completed', 'Archived', 'NotFit'] as WorkItemStatus[] }

  try {
    const [
      overdue,
      dueToday,
      in7DaysDue,
      in30DaysDue,
      escalated,
      completedThisWeek,
      total,
      openActions,
      decisionNeeded,
      alertDeliveries,
      teamPulse,
      priorityItems,
    ] = await Promise.all([
      db.workItem.count({ where: { dueDate: { lt: today }, status: nonFinal } }),
      db.workItem.count({ where: { dueDate: { gte: today, lte: endOfToday }, status: nonFinal } }),
      db.workItem.count({ where: { dueDate: { gte: today, lt: in7Days }, status: nonFinal } }),
      db.workItem.count({ where: { dueDate: { gte: in7Days, lt: in30Days }, status: nonFinal } }),
      db.workItem.count({ where: { status: { in: ['Escalated', 'DecisionNeeded', 'FollowUpDue'] } } }),
      db.workItem.count({ where: { status: 'Completed', updatedAt: { gte: startOfWeek } } }),
      db.workItem.count({ where: { status: nonFinal } }),
      db.action.count({ where: { status: 'Open' } }),
      db.workItem.count({ where: { decisionNeeded: true, status: nonFinal } }),
      db.alertDelivery.count({ where: { status: { in: ['Sent', 'Pending'] } } }),
      Promise.all(
        OWNERS.map((o) =>
          db.workItem.count({ where: { owner: o, status: nonFinal } }).then((c) => ({ owner: o, count: c }))
        )
      ),
      db.workItem.findMany({
        where: { status: nonFinal },
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
        select: { id: true, title: true, company: true, priority: true, dueDate: true },
        take: 10,
      }),
    ])

    const actionRequired = escalated + dueToday
    const atRisk = in7DaysDue + in30DaysDue
    const compliant = Math.max(0, total - overdue - actionRequired - atRisk)

    return NextResponse.json({
      compliance: { compliant, atRisk, actionRequired, overdue, total },
      metrics: { openActions, decisionNeeded, alertDeliveries, completedThisWeek },
      priorityItems: priorityItems.map((item) => ({
        id: item.id,
        title: item.title,
        company: item.company,
        priority: item.priority,
        dueDate: item.dueDate ? item.dueDate.toISOString() : null,
      })),
      teamPulse,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'Service unavailable', details: String(err) },
      { status: 503 }
    )
  }
}
