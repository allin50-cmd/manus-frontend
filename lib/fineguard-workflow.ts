/**
 * FineGuard compliance workflow service.
 *
 * Flow per company:
 *   1. Fetch raw profile from Companies House API
 *   2. Save snapshot → fg_company_snapshots
 *   3. Schedule one fg_alert row per (deadline × threshold) — idempotent
 *   4. Process pending alerts whose reminder_date ≤ today
 *      → create fg_message_logs (send email if RESEND_API_KEY is set)
 *      → append fg_reminder_events
 *   5. Write every major step to fg_activity_log
 *
 * Duplicate safety: the UNIQUE constraint on fg_alerts
 * (company_number, alert_type, due_date, reminder_date) ensures idempotency.
 */

import { and, eq, isNull, lte } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import {
  fgActivityLog,
  fgAlerts,
  fgCompanySnapshots,
  fgMessageLogs,
  fgReminderEvents,
  monitoredCompanies,
} from '@/db/schema'

type Db = Awaited<ReturnType<typeof getDb>>
type MonitoredCompany = typeof monitoredCompanies.$inferSelect
type FgAlert = typeof fgAlerts.$inferSelect
type FgSnapshot = typeof fgCompanySnapshots.$inferSelect

const CH_API_BASE = 'https://api.company-information.service.gov.uk'

// Thresholds (days before due date). -1 is the overdue sentinel.
const THRESHOLDS = [90, 60, 30, 14, 7, 0, -1] as const

// ─── Date helpers (UTC throughout) ───────────────────────────────────────────

function todayIso(): string {
  return new Date().toISOString().split('T')[0]
}

function offsetDate(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split('T')[0]
}

function daysUntil(iso: string): number {
  const today = new Date(`${todayIso()}T00:00:00Z`).getTime()
  const due = new Date(`${iso}T00:00:00Z`).getTime()
  return Math.round((due - today) / 86_400_000)
}

// For the overdue sentinel (daysBefore = -1), the reminder fires the day after
// the due date so there is exactly one overdue alert per (company, type, dueDate).
function reminderDateFor(dueDate: string, daysBefore: number): string {
  return daysBefore < 0 ? offsetDate(dueDate, 1) : offsetDate(dueDate, -daysBefore)
}

// ─── Companies House fetch ────────────────────────────────────────────────────

function chHeader(): string {
  const key = process.env.COMPANIES_HOUSE_API_KEY ?? ''
  return `Basic ${Buffer.from(`${key}:`).toString('base64')}`
}

export async function fetchCompanyProfile(
  companyNumber: string,
): Promise<Record<string, unknown>> {
  if (!process.env.COMPANIES_HOUSE_API_KEY) {
    throw new Error('COMPANIES_HOUSE_API_KEY is not configured')
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15_000)
  const res = await fetch(
    `${CH_API_BASE}/company/${encodeURIComponent(companyNumber.toUpperCase())}`,
    { headers: { Authorization: chHeader() }, signal: controller.signal },
  ).finally(() => clearTimeout(timer))

  if (!res.ok) {
    throw new Error(`Companies House API returned ${res.status} for ${companyNumber}`)
  }
  return res.json() as Promise<Record<string, unknown>>
}

// ─── Activity log ─────────────────────────────────────────────────────────────

async function logActivity(
  db: Db,
  action: string,
  opts: {
    entityType?: string
    entityId?: string
    detail?: Record<string, unknown>
  } = {},
): Promise<void> {
  await db.insert(fgActivityLog).values({
    action,
    entityType: opts.entityType,
    entityId: opts.entityId,
    detail: opts.detail ?? null,
  })
}

// ─── Snapshot ─────────────────────────────────────────────────────────────────

function extractDates(raw: Record<string, unknown>) {
  const acc = raw.accounts as Record<string, unknown> | undefined
  const cs = raw.confirmation_statement as Record<string, unknown> | undefined
  const nextAcc = acc?.next_accounts as Record<string, unknown> | undefined
  const lastAcc = acc?.last_accounts as Record<string, unknown> | undefined

  return {
    companyName: (raw.company_name as string | undefined) ?? null,
    companyStatus: (raw.company_status as string | undefined) ?? null,
    accountsNextDue: (nextAcc?.due_on as string | undefined) ?? null,
    confirmationStatementNextDue: (cs?.next_due as string | undefined) ?? null,
    lastAccountsMadeUpTo: (lastAcc?.made_up_to as string | undefined) ?? null,
    lastConfirmationStatementDate: (cs?.last_made_up_to as string | undefined) ?? null,
  }
}

async function saveSnapshot(
  db: Db,
  companyNumber: string,
  rawData: Record<string, unknown>,
): Promise<FgSnapshot> {
  const dates = extractDates(rawData)
  const [row] = await db
    .insert(fgCompanySnapshots)
    .values({
      companyNumber,
      rawData,
      companyName: dates.companyName,
      companyStatus: dates.companyStatus,
      accountsNextDue: dates.accountsNextDue,
      confirmationStatementNextDue: dates.confirmationStatementNextDue,
      lastAccountsMadeUpTo: dates.lastAccountsMadeUpTo,
      lastConfirmationStatementDate: dates.lastConfirmationStatementDate,
    })
    .returning()
  return row
}

// ─── Alert scheduling ─────────────────────────────────────────────────────────

async function scheduleAlerts(
  db: Db,
  companyNumber: string,
  snapshot: FgSnapshot,
): Promise<number> {
  const deadlines: { alertType: string; dueDate: string }[] = []
  if (snapshot.accountsNextDue) {
    deadlines.push({ alertType: 'accounts', dueDate: snapshot.accountsNextDue })
  }
  if (snapshot.confirmationStatementNextDue) {
    deadlines.push({
      alertType: 'confirmation-statement',
      dueDate: snapshot.confirmationStatementNextDue,
    })
  }

  let created = 0
  for (const { alertType, dueDate } of deadlines) {
    for (const daysBefore of THRESHOLDS) {
      const reminderDate = reminderDateFor(dueDate, daysBefore)
      const inserted = await db
        .insert(fgAlerts)
        .values({ companyNumber, alertType, dueDate, reminderDate, daysBefore })
        .onConflictDoNothing()
        .returning({ id: fgAlerts.id })
      if (inserted.length > 0) created++
    }
  }
  return created
}

// ─── Message dispatch ─────────────────────────────────────────────────────────

function buildReminder(
  company: MonitoredCompany,
  alert: FgAlert,
  daysLeft: number,
): { subject: string; body: string } {
  const label =
    alert.alertType === 'accounts' ? 'Annual Accounts' : 'Confirmation Statement'
  const dateStr = new Date(`${alert.dueDate}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  let subject: string
  let body: string

  if (daysLeft < 0) {
    subject = `OVERDUE: ${label} for ${company.companyName}`
    body = `${label} for ${company.companyName} (${company.companyNumber}) was due on ${dateStr} and is now ${Math.abs(daysLeft)} day(s) overdue.`
  } else if (daysLeft === 0) {
    subject = `DUE TODAY: ${label} for ${company.companyName}`
    body = `${label} for ${company.companyName} (${company.companyNumber}) is due TODAY (${dateStr}). Please file immediately to avoid penalties.`
  } else {
    const urgency = daysLeft <= 7 ? '⚠️ URGENT: ' : ''
    subject = `${urgency}Reminder: ${label} due in ${daysLeft} days — ${company.companyName}`
    body = `${label} for ${company.companyName} (${company.companyNumber}) is due on ${dateStr} — ${daysLeft} days remaining.`
  }

  return { subject, body }
}

async function dispatchReminder(
  db: Db,
  company: MonitoredCompany,
  alert: FgAlert,
): Promise<'sent' | 'logged' | 'failed'> {
  const daysLeft = daysUntil(alert.dueDate)
  const { subject, body } = buildReminder(company, alert, daysLeft)

  const resendKey = process.env.RESEND_API_KEY
  let channel = 'log'
  let status: 'sent' | 'logged' | 'failed' = 'logged'

  if (resendKey && company.email) {
    channel = 'email'
    const from = process.env.RESEND_FROM ?? 'FineGuard Alerts <alerts@fineguard.co.uk>'
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: company.email,
          subject,
          html: `<p style="font-family:sans-serif">${body}</p>`,
          reply_to: 'hello@fineguard.co.uk',
        }),
      })
      status = res.ok ? 'sent' : 'failed'
    } catch {
      status = 'failed'
    }
  }

  await db.insert(fgMessageLogs).values({
    companyNumber: company.companyNumber,
    channel,
    recipient: company.email ?? undefined,
    subject,
    body,
    status,
  })

  return status
}

// ─── Process due alerts ───────────────────────────────────────────────────────

async function processDueAlerts(
  db: Db,
  companyNumber: string,
  company: MonitoredCompany,
): Promise<number> {
  const today = todayIso()
  const dueAlerts = await db
    .select()
    .from(fgAlerts)
    .where(
      and(
        eq(fgAlerts.companyNumber, companyNumber),
        eq(fgAlerts.status, 'pending'),
        lte(fgAlerts.reminderDate, today),
      ),
    )

  for (const alert of dueAlerts) {
    const outcome = await dispatchReminder(db, company, alert)

    await db
      .update(fgAlerts)
      .set({ status: outcome, processedAt: new Date() })
      .where(eq(fgAlerts.id, alert.id))

    await db.insert(fgReminderEvents).values({
      alertId: alert.id,
      companyNumber,
      eventType: outcome,
      detail: `${alert.alertType} | due ${alert.dueDate} | daysBefore=${alert.daysBefore}`,
    })
  }

  return dueAlerts.length
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface CompanyWorkflowResult {
  companyNumber: string
  companyName: string
  snapshotId: string
  alertsScheduled: number
  remindersProcessed: number
  error?: string
}

export async function processCompany(
  companyNumber: string,
): Promise<CompanyWorkflowResult> {
  const db = await getDb()
  const num = companyNumber.trim().toUpperCase()

  const [company] = await db
    .select()
    .from(monitoredCompanies)
    .where(eq(monitoredCompanies.companyNumber, num))
    .limit(1)

  if (!company) throw new Error(`Company ${num} is not in monitored_companies`)

  await logActivity(db, 'process_started', {
    entityType: 'company',
    entityId: num,
    detail: { companyName: company.companyName },
  })

  const rawData = await fetchCompanyProfile(num)

  await logActivity(db, 'ch_fetch_complete', {
    entityType: 'company',
    entityId: num,
    detail: { status: (rawData.company_status as string) ?? null },
  })

  const snapshot = await saveSnapshot(db, num, rawData)

  await logActivity(db, 'snapshot_saved', {
    entityType: 'snapshot',
    entityId: snapshot.id,
    detail: {
      accountsNextDue: snapshot.accountsNextDue,
      confirmationStatementNextDue: snapshot.confirmationStatementNextDue,
      lastAccountsMadeUpTo: snapshot.lastAccountsMadeUpTo,
      lastConfirmationStatementDate: snapshot.lastConfirmationStatementDate,
    },
  })

  const alertsScheduled = await scheduleAlerts(db, num, snapshot)

  await logActivity(db, 'alerts_scheduled', {
    entityType: 'company',
    entityId: num,
    detail: { alertsScheduled },
  })

  const remindersProcessed = await processDueAlerts(db, num, company)

  await logActivity(db, 'reminders_processed', {
    entityType: 'company',
    entityId: num,
    detail: { remindersProcessed },
  })

  return {
    companyNumber: num,
    companyName: company.companyName,
    snapshotId: snapshot.id,
    alertsScheduled,
    remindersProcessed,
  }
}

export async function processAllActiveCompanies(): Promise<{
  total: number
  succeeded: number
  failed: number
  results: CompanyWorkflowResult[]
}> {
  const db = await getDb()

  const rows = await db
    .select({ companyNumber: monitoredCompanies.companyNumber })
    .from(monitoredCompanies)
    .where(isNull(monitoredCompanies.cancelledAt))

  await logActivity(db, 'batch_started', {
    entityType: 'company',
    detail: { count: rows.length },
  })

  const results: CompanyWorkflowResult[] = []
  let failed = 0

  for (const { companyNumber } of rows) {
    try {
      results.push(await processCompany(companyNumber))
    } catch (err) {
      failed++
      results.push({
        companyNumber,
        companyName: '',
        snapshotId: '',
        alertsScheduled: 0,
        remindersProcessed: 0,
        error: String(err),
      })
    }
  }

  await logActivity(db, 'batch_complete', {
    entityType: 'company',
    detail: { total: rows.length, succeeded: rows.length - failed, failed },
  })

  return { total: rows.length, succeeded: rows.length - failed, failed, results }
}
