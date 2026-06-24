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
import { and, gte, lt, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

function currentWeekStart(): string {
  const d = new Date()
  const day = d.getUTCDay()
  d.setUTCDate(d.getUTCDate() + (day === 0 ? -6 : 1 - day))
  return d.toISOString().split('T')[0]
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()

  const reports = await db
    .select()
    .from(utWeeklyReports)
    .orderBy(desc(utWeeklyReports.weekStart))
    .limit(2)

  if (reports.length > 0) {
    const current = reports[0]
    const previous = reports[1] ?? null
    return NextResponse.json({
      currentWeek: {
        weekStart: current.weekStart,
        weekEnd: current.weekEnd,
        rate: Number(current.consolidationRate),
        utActions: current.utActions,
        workflowLeaks: current.workflowLeaks,
        totalBusinessActions: current.totalBusinessActions,
      },
      previousWeek: previous
        ? {
            weekStart: previous.weekStart,
            rate: Number(previous.consolidationRate),
          }
        : null,
      trend: current.trend ?? null,
    })
  }

  // No weekly reports yet — compute live from raw events this week
  const weekStart = currentWeekStart()
  const weekStartDate = new Date(`${weekStart}T00:00:00Z`)
  const now = new Date()

  const events = await db
    .select({ eventType: utActivityEvents.eventType })
    .from(utActivityEvents)
    .where(
      and(
        gte(utActivityEvents.occurredAt, weekStartDate),
        lt(utActivityEvents.occurredAt, now),
      ),
    )

  const leaks = events.filter((e) => e.eventType === 'workflow_leak').length
  const utActions = events.filter((e) => e.eventType !== 'workflow_leak').length
  const total = utActions + leaks
  const rate = total > 0 ? Number(((utActions / total) * 100).toFixed(2)) : 0

  return NextResponse.json({
    currentWeek: {
      weekStart,
      weekEnd: null,
      rate,
      utActions,
      workflowLeaks: leaks,
      totalBusinessActions: total,
    },
    previousWeek: null,
    trend: null,
  })
}
