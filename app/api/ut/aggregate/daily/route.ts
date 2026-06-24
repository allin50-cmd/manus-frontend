/**
 * POST /api/ut/aggregate/daily
 *
 * Counts ut_activity_events for a given calendar day and upserts a row into
 * ut_daily_metrics. Safe to run multiple times (idempotent via UNIQUE date).
 *
 * Body: { "date": "YYYY-MM-DD" }  — defaults to yesterday (UTC).
 *
 * Auth: session cookie OR x-cron-secret header.
 */

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { getDb } from '@/lib/db'
import { utActivityEvents, utDailyMetrics } from '@/db/schema'
import { getSession } from '@/lib/auth'
import { and, gte, lt, count, eq, isNotNull } from 'drizzle-orm'

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

function yesterdayIso(): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().split('T')[0]
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session && !hasCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let targetDate = yesterdayIso()
  try {
    const body = await req.json()
    if (typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      targetDate = body.date
    }
  } catch { /* empty body — use default */ }

  const db = await getDb()

  const dayStart = new Date(`${targetDate}T00:00:00Z`)
  const dayEnd = new Date(`${targetDate}T00:00:00Z`)
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1)

  const dayFilter = and(gte(utActivityEvents.occurredAt, dayStart), lt(utActivityEvents.occurredAt, dayEnd))

  // Push aggregation to the DB — avoids loading all events into memory.
  const eventCounts = await db
    .select({ eventType: utActivityEvents.eventType, n: count() })
    .from(utActivityEvents)
    .where(dayFilter)
    .groupBy(utActivityEvents.eventType)

  const dauResult = await db
    .selectDistinct({ userId: utActivityEvents.userId })
    .from(utActivityEvents)
    .where(and(dayFilter, eq(utActivityEvents.eventType, 'app_opened'), isNotNull(utActivityEvents.userId)))

  const countOf = (type: string) => eventCounts.find((r) => r.eventType === type)?.n ?? 0
  const dau = dauResult.length

  const metrics = {
    date: targetDate,
    dau,
    appOpens: countOf('app_opened'),
    tasksCreated: countOf('task_created'),
    tasksCompleted: countOf('task_completed'),
    callsLogged: countOf('call_logged'),
    alertsGenerated: countOf('alert_generated'),
    alertsAcknowledged: countOf('alert_acknowledged'),
    documentsUploaded: countOf('document_uploaded'),
    quotesCreated: countOf('quote_created'),
    invoicesCreated: countOf('invoice_created'),
    companiesAdded: countOf('company_created'),
    contactsAdded: countOf('contact_created'),
    workflowLeaks: countOf('workflow_leak'),
    computedAt: new Date(),
  }

  await db
    .insert(utDailyMetrics)
    .values(metrics)
    .onConflictDoUpdate({
      target: utDailyMetrics.date,
      set: {
        dau: metrics.dau,
        appOpens: metrics.appOpens,
        tasksCreated: metrics.tasksCreated,
        tasksCompleted: metrics.tasksCompleted,
        callsLogged: metrics.callsLogged,
        alertsGenerated: metrics.alertsGenerated,
        alertsAcknowledged: metrics.alertsAcknowledged,
        documentsUploaded: metrics.documentsUploaded,
        quotesCreated: metrics.quotesCreated,
        invoicesCreated: metrics.invoicesCreated,
        companiesAdded: metrics.companiesAdded,
        contactsAdded: metrics.contactsAdded,
        workflowLeaks: metrics.workflowLeaks,
        computedAt: metrics.computedAt,
      },
    })

  return NextResponse.json({ success: true, date: targetDate, metrics })
}
