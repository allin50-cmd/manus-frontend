/**
 * FineGuard compliance workflow service.
 *
 * Flow per company — every step writes to fg_activity_log with the same run_id:
 *
 *   process_started        → run begins, company looked up
 *   company_checked        → raw profile fetched from Companies House API
 *   snapshot_created       → raw data + extracted dates saved (fg_company_snapshots)
 *   alerts_scheduled       → fg_alert rows upserted for every deadline × threshold
 *   reminder_processed     → per-alert: dispatched; fg_alert.status updated
 *   message_sent_or_logged → per-alert: message written to fg_message_logs
 *   process_completed      → success summary (mutually exclusive with process_failed)
 *   process_failed         → error detail written; original error rethrown
 *
 * Duplicate safety:
 *   UNIQUE (company_number, alert_type, due_date, reminder_date) on fg_alerts means
 *   onConflictDoNothing() silently skips existing rows. Running the same company
 *   twice never inserts duplicate alerts.
 *
 * RESEND_API_KEY absent:
 *   Workflow continues without failing. Messages are written to fg_message_logs
 *   with status = 'logged' instead of 'sent'. No exception is raised.
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

// Thresholds in days before the due date.
// -1 is the overdue sentinel: reminder fires the day AFTER the due date,
// giving exactly one overdue alert per (company, alertType, dueDate).
const THRESHOLDS = [90, 60, 30, 14, 7, 0, -1] as const

// ─── Date helpers (UTC throughout to avoid DST edge cases) ────────────────────

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

// ─── Activity log (never throws — logging must not abort the workflow) ─────────

async function logActivity(
  db: Db,
  action: string,
  opts: {
    runId: string
    entityType?: string
    entityId?: string
    detail?: Record<string, unknown>
  },
): Promise<void> {
  try {
    await db.insert(fgActivityLog).values({
      runId: opts.runId,
      action,
      entityType: opts.entityType,
      entityId: opts.entityId,
      detail: opts.detail ?? null,
    })
  } catch {
    // Swallow — activity log failures must never abort the main workflow
  }
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
  runId: string,
): Promise<FgSnapshot> {
  const dates = extractDates(rawData)
  const [row] = await db
    .insert(fgCompanySnapshots)
    .values({
      runId,
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
): Promise<{ alertsCreated: number; duplicatesSkipped: number }> {
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

  let alertsCreated = 0
  let duplicatesSkipped = 0

  for (const { alertType, dueDate } of deadlines) {
    for (const daysBefore of THRESHOLDS) {
      const reminderDate = reminderDateFor(dueDate, daysBefore)
      const inserted = await db
        .insert(fgAlerts)
        .values({ companyNumber, alertType, dueDate, reminderDate, daysBefore })
        .onConflictDoNothing()
        .returning({ id: fgAlerts.id })

      if (inserted.length > 0) alertsCreated++
      else duplicatesSkipped++
    }
  }

  return { alertsCreated, duplicatesSkipped }
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

  if (daysLeft < 0) {
    return {
      subject: `OVERDUE: ${label} for ${company.companyName}`,
      body: `${label} for ${company.companyName} (${company.companyNumber}) was due on ${dateStr} and is now ${Math.abs(daysLeft)} day(s) overdue.`,
    }
  }
  if (daysLeft === 0) {
    return {
      subject: `DUE TODAY: ${label} for ${company.companyName}`,
      body: `${label} for ${company.companyName} (${company.companyNumber}) is due TODAY (${dateStr}). Please file immediately to avoid penalties.`,
    }
  }
  const urgency = daysLeft <= 7 ? '⚠️ URGENT: ' : ''
  return {
    subject: `${urgency}Reminder: ${label} due in ${daysLeft} days — ${company.companyName}`,
    body: `${label} for ${company.companyName} (${company.companyNumber}) is due on ${dateStr} — ${daysLeft} days remaining.`,
  }
}

async function dispatchReminder(
  db: Db,
  company: MonitoredCompany,
  alert: FgAlert,
  runId: string,
): Promise<'sent' | 'logged'> {
  const daysLeft = daysUntil(alert.dueDate)
  const { subject, body } = buildReminder(company, alert, daysLeft)

  const resendKey = process.env.RESEND_API_KEY
  let channel = 'log'
  let outcome: 'sent' | 'logged' = 'logged'

  if (resendKey && company.email) {
    channel = 'email'
    try {
      const from = process.env.RESEND_FROM ?? 'FineGuard Alerts <alerts@fineguard.co.uk>'
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
      // A failed send still creates a message_log (status='failed') but
      // counts as 'logged' in summary — the message is recorded, not delivered.
      if (res.ok) outcome = 'sent'
    } catch {
      // Network error — fall through to 'logged'
    }
  }

  const msgStatus = outcome === 'sent' ? 'sent' : resendKey && company.email ? 'failed' : 'logged'

  await db.insert(fgMessageLogs).values({
    runId,
    companyNumber: company.companyNumber,
    channel,
    recipient: company.email ?? undefined,
    subject,
    body,
    status: msgStatus,
  })

  await logActivity(db, 'message_sent_or_logged', {
    runId,
    entityType: 'alert',
    entityId: alert.id,
    detail: {
      outcome,
      channel,
      alertType: alert.alertType,
      dueDate: alert.dueDate,
      recipient: company.email ?? null,
    },
  })

  return outcome
}

// ─── Process pending alerts ───────────────────────────────────────────────────

async function processDueAlerts(
  db: Db,
  companyNumber: string,
  company: MonitoredCompany,
  runId: string,
): Promise<{ remindersProcessed: number; messagesSent: number; messagesLogged: number }> {
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

  let messagesSent = 0
  let messagesLogged = 0

  for (const alert of dueAlerts) {
    const outcome = await dispatchReminder(db, company, alert, runId)

    await db
      .update(fgAlerts)
      .set({ status: outcome, processedAt: new Date() })
      .where(eq(fgAlerts.id, alert.id))

    await db.insert(fgReminderEvents).values({
      runId,
      alertId: alert.id,
      companyNumber,
      eventType: outcome,
      detail: `${alert.alertType} | due ${alert.dueDate} | daysBefore=${alert.daysBefore}`,
    })

    await logActivity(db, 'reminder_processed', {
      runId,
      entityType: 'alert',
      entityId: alert.id,
      detail: { alertType: alert.alertType, dueDate: alert.dueDate, outcome },
    })

    if (outcome === 'sent') messagesSent++
    else messagesLogged++
  }

  return { remindersProcessed: dueAlerts.length, messagesSent, messagesLogged }
}

// ─── Public interfaces ────────────────────────────────────────────────────────

export interface CompanyWorkflowResult {
  companyNumber: string
  companyName: string
  runId: string
  snapshotId: string
  alertsCreated: number
  duplicatesSkipped: number
  remindersProcessed: number
  messagesSent: number
  messagesLogged: number
  error?: string
}

export interface BatchWorkflowResult {
  runId: string
  processedCompanies: number
  snapshotsCreated: number
  alertsCreated: number
  duplicatesSkipped: number
  remindersProcessed: number
  messagesSent: number
  messagesLogged: number
  errors: number
  results: CompanyWorkflowResult[]
}

// ─── processCompany ───────────────────────────────────────────────────────────

/**
 * Process a single company through the full compliance workflow.
 *
 * @param companyNumber - Companies House number (case-insensitive).
 * @param runId         - Shared run_id from a batch caller; generated when absent.
 */
export async function processCompany(
  companyNumber: string,
  runId?: string,
): Promise<CompanyWorkflowResult> {
  const db = await getDb()
  const num = companyNumber.trim().toUpperCase()
  const myRunId = runId ?? crypto.randomUUID()

  const [company] = await db
    .select()
    .from(monitoredCompanies)
    .where(eq(monitoredCompanies.companyNumber, num))
    .limit(1)

  if (!company) {
    throw new Error(
      `Company ${num} is not in monitored_companies. ` +
      `Add it via POST /api/monitored first.`,
    )
  }

  await logActivity(db, 'process_started', {
    runId: myRunId,
    entityType: 'company',
    entityId: num,
    detail: { companyName: company.companyName },
  })

  try {
    const rawData = await fetchCompanyProfile(num)

    await logActivity(db, 'company_checked', {
      runId: myRunId,
      entityType: 'company',
      entityId: num,
      detail: {
        companyStatus: (rawData.company_status as string) ?? null,
        companyName: (rawData.company_name as string) ?? null,
      },
    })

    const snapshot = await saveSnapshot(db, num, rawData, myRunId)

    await logActivity(db, 'snapshot_created', {
      runId: myRunId,
      entityType: 'snapshot',
      entityId: snapshot.id,
      detail: {
        accountsNextDue: snapshot.accountsNextDue,
        confirmationStatementNextDue: snapshot.confirmationStatementNextDue,
        lastAccountsMadeUpTo: snapshot.lastAccountsMadeUpTo,
        lastConfirmationStatementDate: snapshot.lastConfirmationStatementDate,
      },
    })

    const { alertsCreated, duplicatesSkipped } = await scheduleAlerts(db, num, snapshot)

    await logActivity(db, 'alerts_scheduled', {
      runId: myRunId,
      entityType: 'company',
      entityId: num,
      detail: { alertsCreated, duplicatesSkipped },
    })

    const { remindersProcessed, messagesSent, messagesLogged } =
      await processDueAlerts(db, num, company, myRunId)

    const result: CompanyWorkflowResult = {
      companyNumber: num,
      companyName: company.companyName,
      runId: myRunId,
      snapshotId: snapshot.id,
      alertsCreated,
      duplicatesSkipped,
      remindersProcessed,
      messagesSent,
      messagesLogged,
    }

    await logActivity(db, 'process_completed', {
      runId: myRunId,
      entityType: 'company',
      entityId: num,
      detail: { alertsCreated, duplicatesSkipped, remindersProcessed, messagesSent, messagesLogged },
    })

    return result
  } catch (err) {
    await logActivity(db, 'process_failed', {
      runId: myRunId,
      entityType: 'company',
      entityId: num,
      detail: { error: String(err) },
    })
    throw err
  }
}

// ─── processAllActiveCompanies ────────────────────────────────────────────────

/**
 * Process all non-cancelled monitored companies sequentially.
 * All activity log entries share the same batch run_id.
 */
export async function processAllActiveCompanies(): Promise<BatchWorkflowResult> {
  const db = await getDb()
  const runId = crypto.randomUUID()

  const rows = await db
    .select({ companyNumber: monitoredCompanies.companyNumber })
    .from(monitoredCompanies)
    .where(isNull(monitoredCompanies.cancelledAt))

  await logActivity(db, 'process_started', {
    runId,
    entityType: 'batch',
    detail: { companyCount: rows.length },
  })

  const results: CompanyWorkflowResult[] = []
  let errors = 0

  for (const { companyNumber } of rows) {
    try {
      results.push(await processCompany(companyNumber, runId))
    } catch (err) {
      errors++
      results.push({
        companyNumber,
        companyName: '',
        runId,
        snapshotId: '',
        alertsCreated: 0,
        duplicatesSkipped: 0,
        remindersProcessed: 0,
        messagesSent: 0,
        messagesLogged: 0,
        error: String(err),
      })
    }
  }

  const snapshotsCreated = results.filter((r) => !r.error && r.snapshotId).length
  const alertsCreated = results.reduce((s, r) => s + r.alertsCreated, 0)
  const duplicatesSkipped = results.reduce((s, r) => s + r.duplicatesSkipped, 0)
  const remindersProcessed = results.reduce((s, r) => s + r.remindersProcessed, 0)
  const messagesSent = results.reduce((s, r) => s + r.messagesSent, 0)
  const messagesLogged = results.reduce((s, r) => s + r.messagesLogged, 0)

  await logActivity(db, 'process_completed', {
    runId,
    entityType: 'batch',
    detail: {
      processedCompanies: rows.length,
      snapshotsCreated,
      alertsCreated,
      duplicatesSkipped,
      remindersProcessed,
      messagesSent,
      messagesLogged,
      errors,
    },
  })

  return {
    runId,
    processedCompanies: rows.length,
    snapshotsCreated,
    alertsCreated,
    duplicatesSkipped,
    remindersProcessed,
    messagesSent,
    messagesLogged,
    errors,
    results,
  }
}
