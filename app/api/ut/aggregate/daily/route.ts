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
import { getDb } from '@/lib/db'
import { utActivityEvents, utDailyMetrics } from '@/db/schema'
import { getSession } from '@/lib/auth'
import { and, gte, lt } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

function hasCronAuth(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  return !!secret && req.headers.get('x-cron-secret') === secret
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

  const events = await db
    .select({
      userId: utActivityEvents.userId,
      eventType: utActivityEvents.eventType,
    })
    .from(utActivityEvents)
    .where(
      and(
        gte(utActivityEvents.occurredAt, dayStart),
        lt(utActivityEvents.occurredAt, dayEnd),
      ),
    )

  const count = (type: string) => events.filter((e) => e.eventType === type).length

  const dau = new Set(
    events
      .filter((e) => e.eventType === 'app_opened' && e.userId)
      .map((e) => e.userId),
  ).size

  const metrics = {
    date: targetDate,
    dau,
    appOpens: count('app_opened'),
    tasksCreated: count('task_created'),
    tasksCompleted: count('task_completed'),
    callsLogged: count('call_logged'),
    alertsGenerated: count('alert_generated'),
    alertsAcknowledged: count('alert_acknowledged'),
    documentsUploaded: count('document_uploaded'),
    quotesCreated: count('quote_created'),
    invoicesCreated: count('invoice_created'),
    companiesAdded: count('company_created'),
    contactsAdded: count('contact_created'),
    workflowLeaks: count('workflow_leak'),
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
