/**
 * GET /api/ut/metrics
 *
 * Returns the two most recent weekly reports for the Today page widget.
 * If no reports exist yet, falls back to a live count of this week's events.
 */

import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { utWeeklyReports, utActivityEvents } from '@/db/schema'
import { getSession } from '@/lib/auth'
import { and, gte, lt, eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()

  // Current week — always live so the response reflects today's activity.
  const now = new Date()
  const day = now.getUTCDay()
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() + (day === 0 ? -6 : 1 - day))
  monday.setUTCHours(0, 0, 0, 0)
  const weekStart = monday.toISOString().split('T')[0]

  const events = await db
    .select({ eventType: utActivityEvents.eventType })
    .from(utActivityEvents)
    .where(and(gte(utActivityEvents.occurredAt, monday), lt(utActivityEvents.occurredAt, now)))

  const leaks = events.filter((e) => e.eventType === 'workflow_leak').length
  const utActions = events.filter((e) => e.eventType !== 'workflow_leak').length
  const total = utActions + leaks
  const rate = total > 0 ? Number(((utActions / total) * 100).toFixed(2)) : 0

  // Previous week — look up the completed report for last week specifically.
  const lastWeekMonday = new Date(monday)
  lastWeekMonday.setUTCDate(monday.getUTCDate() - 7)
  const lastWeekMondayStr = lastWeekMonday.toISOString().split('T')[0]

  const [prevReport] = await db
    .select()
    .from(utWeeklyReports)
    .where(eq(utWeeklyReports.weekStart, lastWeekMondayStr))
    .limit(1)

  const prevRate = prevReport ? Number(prevReport.consolidationRate) : null
  const trend =
    prevRate === null
      ? null
      : rate > prevRate
      ? 'up'
      : rate < prevRate
      ? 'down'
      : 'flat'

  return NextResponse.json({
    currentWeek: {
      weekStart,
      weekEnd: null,
      rate,
      utActions,
      workflowLeaks: leaks,
      totalBusinessActions: total,
    },
    previousWeek: prevReport
      ? { weekStart: prevReport.weekStart, rate: prevRate }
      : null,
    trend,
  })
}
