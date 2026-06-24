/**
 * POST /api/ut/aggregate/weekly
 *
 * Sums ut_daily_metrics for an ISO week (Mon–Sun) and upserts a row into
 * ut_weekly_reports with the Operational Consolidation Rate.
 *
 * Formula:
 *   Operational Consolidation Rate =
 *     ut_actions / (ut_actions + workflow_leaks) × 100
 *
 * ut_actions = all tracked UltraTechOS events except workflow_leak.
 *
 * Body: { "date": "YYYY-MM-DD" }  — any day in the target week; defaults to
 *                                    the most recently completed week (last Mon).
 *
 * Auth: session cookie OR x-cron-secret header.
 */

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { getDb } from '@/lib/db'
import { utDailyMetrics, utWeeklyReports } from '@/db/schema'
import { getSession } from '@/lib/auth'
import { and, gte, lte, eq, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

function hasCronAuth(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const provided = req.headers.get('x-cron-secret') ?? ''
  if (provided.length !== secret.length) return false
  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(secret))
  } catch {
    return false
  }
}

function getWeekBounds(isoDate: string): { weekStart: string; weekEnd: string } {
  const d = new Date(`${isoDate}T00:00:00Z`)
  const dayOfWeek = d.getUTCDay() // 0=Sun … 6=Sat
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(d)
  monday.setUTCDate(d.getUTCDate() + diffToMonday)
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)
  return {
    weekStart: monday.toISOString().split('T')[0],
    weekEnd: sunday.toISOString().split('T')[0],
  }
}

function prevWeekStart(weekStart: string): string {
  const d = new Date(`${weekStart}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 7)
  return d.toISOString().split('T')[0]
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session && !hasCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Default: most recently completed week — go back 7 days then snap to that week's Monday.
  // Using getWeekBounds avoids the Sunday edge case where a raw -7 then Monday-snap lands
  // on the Monday two weeks prior.
  const lastMonday = (() => {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - 7)
    return getWeekBounds(d.toISOString().split('T')[0]).weekStart
  })()

  let inputDate = lastMonday
  try {
    const body = await req.json()
    if (typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      inputDate = body.date
    }
  } catch { /* empty body */ }

  const { weekStart, weekEnd } = getWeekBounds(inputDate)

  const db = await getDb()

  // Sum daily metrics for the week
  const days = await db
    .select()
    .from(utDailyMetrics)
    .where(
      and(
        gte(utDailyMetrics.date, weekStart),
        lte(utDailyMetrics.date, weekEnd),
      ),
    )

  const sum = (field: keyof typeof days[0]) =>
    days.reduce((acc, d) => acc + ((d[field] as number) ?? 0), 0)

  const utActions =
    sum('appOpens') +
    sum('tasksCreated') +
    sum('tasksCompleted') +
    sum('callsLogged') +
    sum('alertsGenerated') +
    sum('alertsAcknowledged') +
    sum('documentsUploaded') +
    sum('quotesCreated') +
    sum('invoicesCreated') +
    sum('companiesAdded') +
    sum('contactsAdded')

  const workflowLeaks = sum('workflowLeaks')
  const totalBusinessActions = utActions + workflowLeaks

  const consolidationRate =
    totalBusinessActions > 0
      ? Number(((utActions / totalBusinessActions) * 100).toFixed(2))
      : 0

  // Look up previous week's rate
  const prevStart = prevWeekStart(weekStart)
  const [prevReport] = await db
    .select({ consolidationRate: utWeeklyReports.consolidationRate })
    .from(utWeeklyReports)
    .where(eq(utWeeklyReports.weekStart, prevStart))
    .limit(1)

  const prevWeekRate = prevReport ? Number(prevReport.consolidationRate) : null

  const trend =
    prevWeekRate === null
      ? null
      : consolidationRate > prevWeekRate
      ? 'up'
      : consolidationRate < prevWeekRate
      ? 'down'
      : 'flat'

  const report = {
    weekStart,
    weekEnd,
    totalBusinessActions,
    utActions,
    workflowLeaks,
    consolidationRate: consolidationRate.toFixed(2),
    prevWeekRate: prevWeekRate !== null ? prevWeekRate.toFixed(2) : null,
    trend,
    computedAt: new Date(),
  }

  await db
    .insert(utWeeklyReports)
    .values(report)
    .onConflictDoUpdate({
      target: utWeeklyReports.weekStart,
      set: {
        weekEnd: report.weekEnd,
        totalBusinessActions: report.totalBusinessActions,
        utActions: report.utActions,
        workflowLeaks: report.workflowLeaks,
        consolidationRate: report.consolidationRate,
        prevWeekRate: report.prevWeekRate,
        trend: report.trend,
        computedAt: report.computedAt,
      },
    })

  return NextResponse.json({ success: true, report })
}
