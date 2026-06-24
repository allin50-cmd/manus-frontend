/**
 * FineGuard Deadline Alert Runner
 *
 * Runs daily (via GitHub Actions cron). For each monitored company with an email:
 *   1. Fetch Companies House deadlines
 *   2. If a deadline is exactly 30, 14, or 7 days away (±1 day window)
 *   3. And we haven't already sent that alert (checked via alert_history)
 *   4. Send an email via Resend and record in alert_history
 *
 * Required env vars:
 *   DATABASE_URL              — Supabase postgres connection string
 *   COMPANIES_HOUSE_API_KEY   — Companies House API key
 *   RESEND_API_KEY            — Resend API key
 *   RESEND_FROM               — Sender address (e.g. alerts@fineguard.co.uk)
 */

import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { and, eq, isNotNull, isNull } from 'drizzle-orm'
import { monitoredCompanies, alertHistory } from '../db/schema'

const ALERT_DAYS = [30, 14, 7]
const CH_API_BASE = 'https://api.company-information.service.gov.uk'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

function daysUntil(dateStr: string): number {
  const due = new Date(dateStr)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  return Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function chAuthHeader(apiKey: string) {
  return `Basic ${Buffer.from(apiKey + ':').toString('base64')}`
}

async function getDeadlines(
  companyNumber: string,
  apiKey: string,
): Promise<{ type: string; dueDate: string; label: string }[]> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)
  const res = await fetch(`${CH_API_BASE}/company/${companyNumber.toUpperCase()}`, {
    headers: { Authorization: chAuthHeader(apiKey) },
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout))
  if (!res.ok) {
    console.warn(`  CH API ${res.status} for ${companyNumber}`)
    return []
  }
  const data = (await res.json()) as any
  const deadlines: { type: string; dueDate: string; label: string }[] = []
  if (data.accounts?.next_accounts?.due_on) {
    deadlines.push({
      type: 'accounts',
      dueDate: data.accounts.next_accounts.due_on,
      label: 'Annual Accounts',
    })
  }
  if (data.confirmation_statement?.next_due) {
    deadlines.push({
      type: 'confirmation-statement',
      dueDate: data.confirmation_statement.next_due,
      label: 'Confirmation Statement',
    })
  }
  return deadlines
}

async function sendEmail(opts: {
  to: string
  subject: string
  html: string
  resendKey: string
  from: string
}): Promise<boolean> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: opts.from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      reply_to: 'hello@fineguard.co.uk',
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    console.error(`  Resend error ${res.status}: ${body}`)
    return false
  }
  return true
}

function alertEmailHtml(opts: {
  companyName: string
  companyNumber: string
  deadlineLabel: string
  dueDate: string
  daysBefore: number
}): string {
  const urgency = opts.daysBefore <= 7 ? 'URGENT: ' : ''
  const dueFormatted = new Date(opts.dueDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F7F8FA;font-family:Inter,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F8FA;padding:32px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden">
        <tr>
          <td style="background:#0B1F3A;padding:20px 28px;display:flex;align-items:center">
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="background:#00A86B;border-radius:8px;width:28px;height:28px;text-align:center;vertical-align:middle">
                <span style="color:#fff;font-size:16px;font-weight:bold;line-height:28px">✓</span>
              </td>
              <td style="padding-left:10px;color:#ffffff;font-size:18px;font-weight:700">FineGuard</td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 28px">
            <p style="margin:0 0 4px;font-size:13px;color:#6B7280;text-transform:uppercase;letter-spacing:.05em;font-weight:600">
              Deadline reminder — ${opts.daysBefore} days to go
            </p>
            <h1 style="margin:0 0 24px;font-size:22px;font-weight:700;color:#0B1F3A">
              ${urgency}${opts.deadlineLabel} due in ${opts.daysBefore} days
            </h1>
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#F7F8FA;border-radius:8px;padding:16px 20px;margin-bottom:24px">
              <tr>
                <td style="font-size:13px;color:#6B7280;padding-bottom:6px">Company</td>
                <td style="font-size:14px;font-weight:600;color:#0B1F3A;text-align:right">${opts.companyName}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#6B7280;padding-bottom:6px">Company number</td>
                <td style="font-size:14px;font-weight:600;color:#0B1F3A;text-align:right">${opts.companyNumber}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#6B7280">Filing due</td>
                <td style="font-size:14px;font-weight:700;color:#${opts.daysBefore <= 7 ? 'DC2626' : '0B1F3A'};text-align:right">${dueFormatted}</td>
              </tr>
            </table>
            <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#374151">
              Your <strong>${opts.deadlineLabel}</strong> for <strong>${opts.companyName}</strong>
              is due on <strong>${dueFormatted}</strong> — that's ${opts.daysBefore} days away.
              Please make sure this is filed with Companies House on time to avoid penalties.
            </p>
            <p style="margin:0 0 8px;font-size:13px;color:#6B7280;line-height:1.5">
              FineGuard monitors your Companies House deadlines and sends you reminders at
              30, 14 and 7 days before each filing date. If you have any questions, reply to
              this email or contact us at
              <a href="mailto:hello@fineguard.co.uk" style="color:#00A86B">hello@fineguard.co.uk</a>.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#F7F8FA;padding:16px 28px;border-top:1px solid #E5E7EB">
            <p style="margin:0;font-size:12px;color:#9CA3AF">
              FineGuard Limited · Registered in England and Wales ·
              <a href="https://fineguard.co.uk/privacy" style="color:#9CA3AF">Privacy</a> ·
              <a href="https://fineguard.co.uk/terms" style="color:#9CA3AF">Terms</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const databaseUrl = requireEnv('DATABASE_URL')
  const chApiKey = requireEnv('COMPANIES_HOUSE_API_KEY')
  const resendKey = requireEnv('RESEND_API_KEY')
  const from = process.env.RESEND_FROM || 'FineGuard Alerts <alerts@fineguard.co.uk>'

  const client = postgres(databaseUrl, { max: 1 })
  const db = drizzle(client)

  let alertsSent = 0
  let alertsSkipped = 0
  let errors = 0

  // Identify active companies with no email — they cannot receive alerts.
  // This must be zero in a correctly configured system. Log loudly and count
  // as errors so the GitHub Action exits non-zero and ops are notified.
  const missingEmail = await db
    .select({
      companyNumber: monitoredCompanies.companyNumber,
      companyName: monitoredCompanies.companyName,
      stripeSessionId: monitoredCompanies.stripeSessionId,
    })
    .from(monitoredCompanies)
    .where(and(isNull(monitoredCompanies.email), isNull(monitoredCompanies.cancelledAt)))

  if (missingEmail.length > 0) {
    console.error(
      `\nFINEGUARD OPS ERROR: ${missingEmail.length} active company/companies have no email — alerts cannot be sent:`
    )
    for (const c of missingEmail) {
      console.error(
        `  MISSING EMAIL: ${c.companyName} (${c.companyNumber}) ` +
        `[stripe_session: ${c.stripeSessionId}]`
      )
    }
    console.error('  Action required: set email in monitored_companies or contact customer to re-activate.\n')
    errors += missingEmail.length
  }

  const companies = await db
    .select()
    .from(monitoredCompanies)
    .where(and(isNotNull(monitoredCompanies.email), isNull(monitoredCompanies.cancelledAt)))

  console.log(`Checking deadlines for ${companies.length} monitored companies...`)

  for (const company of companies) {
    if (!company.email) continue
    console.log(`\n→ ${company.companyName} (${company.companyNumber})`)

    let deadlines: { type: string; dueDate: string; label: string }[]
    try {
      deadlines = await getDeadlines(company.companyNumber, chApiKey)
    } catch (err) {
      console.error(`  Error fetching deadlines: ${err}`)
      errors++
      continue
    }

    for (const deadline of deadlines) {
      const days = daysUntil(deadline.dueDate)
      console.log(`  ${deadline.label}: due ${deadline.dueDate} (${days} days)`)

      if (days < 0) {
        console.log(`  ⏭ Deadline overdue — skipping`)
        continue
      }

      // Sort thresholds ascending so the smallest (most urgent) comes first.
      // We send ONE email per deadline per cron run, using the actual days
      // remaining. All applicable thresholds are recorded in alert_history so
      // they don't fire in future runs — this prevents a newly-monitored company
      // from receiving 3 simultaneous emails with wrong day counts.
      const sortedThresholds = [...ALERT_DAYS].sort((a, b) => a - b)
      let emailThreshold: number | null = null
      const thresholdsToRecord: number[] = []

      for (const threshold of sortedThresholds) {
        if (days > threshold) continue // not yet within this window

        const existing = await db
          .select({ id: alertHistory.id })
          .from(alertHistory)
          .where(
            and(
              eq(alertHistory.companyNumber, company.companyNumber),
              eq(alertHistory.deadlineType, deadline.type),
              eq(alertHistory.dueDate, deadline.dueDate),
              eq(alertHistory.daysBefore, threshold),
            ),
          )
          .limit(1)

        if (existing.length > 0) {
          console.log(`  ✓ ${threshold}-day window for ${deadline.label} already handled`)
          alertsSkipped++
          continue
        }

        if (emailThreshold === null) emailThreshold = threshold // most urgent unsent
        thresholdsToRecord.push(threshold)
      }

      if (emailThreshold === null) continue // all applicable alerts already handled

      const subject = `${days <= 7 ? '⚠️ URGENT: ' : ''}${deadline.label} due in ${days} days — ${company.companyName}`
      const html = alertEmailHtml({
        companyName: company.companyName,
        companyNumber: company.companyNumber,
        deadlineLabel: deadline.label,
        dueDate: deadline.dueDate,
        daysBefore: days,
      })

      const sent = await sendEmail({ to: company.email, subject, html, resendKey, from })

      if (sent) {
        for (const threshold of thresholdsToRecord) {
          await db.insert(alertHistory).values({
            companyNumber: company.companyNumber,
            deadlineType: deadline.type,
            dueDate: deadline.dueDate,
            daysBefore: threshold,
          })
        }
        console.log(
          `  ✉ Sent alert to ${company.email} (${days} days remaining; windows marked: ${thresholdsToRecord.join(', ')})`,
        )
        alertsSent++
      } else {
        errors++
      }
    }
  }

  console.log(`\n─────────────────────────────────`)
  console.log(`Alerts sent:    ${alertsSent}`)
  console.log(`Already sent:   ${alertsSkipped}`)
  console.log(`Errors:         ${errors}`)
  console.log(`─────────────────────────────────`)

  await client.end()

  if (errors > 0) process.exit(1)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
