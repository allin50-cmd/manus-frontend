import { Resend } from 'resend'
import { db } from '@/lib/db'
import {
  selectRecipientsForAlert,
  shouldEscalate,
  type AlertCategory,
  type AlertInput,
} from '@/lib/alert-recipient-selector'
import type { WorkItem } from '@prisma/client'

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  return key ? new Resend(key) : null
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'alerts@resend.dev'

export async function dispatchAlerts(workItem: WorkItem): Promise<void> {
  if (!workItem.company) return

  const recipients = await db.alertRecipient.findMany({
    where: { company: workItem.company, isActive: true },
  })

  if (recipients.length === 0) return

  const alert: AlertInput = {
    id: workItem.id,
    company: workItem.company,
    category: inferCategory(workItem.notes ?? ''),
    severity: priorityToSeverity(workItem.priority),
    deadlineAt: workItem.dueDate,
    now: new Date(),
  }

  const { selected, excluded } = selectRecipientsForAlert(alert, recipients)

  for (const { recipient, reason } of excluded) {
    await db.alertEvent.create({
      data: {
        workItemId: workItem.id,
        recipientId: recipient.id,
        eventType: 'RecipientSuppressed',
        actorType: 'System',
        payload: JSON.stringify({ reason }),
      },
    })
  }

  for (const recipient of selected) {
    const delivery = await db.alertDelivery.create({
      data: {
        workItemId: workItem.id,
        recipientId: recipient.id,
        channel: recipient.preferredChannel as 'Email' | 'Dashboard' | 'Sms' | 'WhatsApp',
        escalationLevel: recipient.escalationLevel,
      },
    })

    await db.alertEvent.create({
      data: {
        workItemId: workItem.id,
        deliveryId: delivery.id,
        recipientId: recipient.id,
        eventType: 'DeliveryCreated',
        actorType: 'System',
        payload: JSON.stringify({ channel: recipient.preferredChannel }),
      },
    })

    if (recipient.preferredChannel === 'Dashboard') {
      await markDeliverySent(delivery.id, workItem.id, recipient.id)
    } else if (recipient.preferredChannel === 'Email') {
      await sendEmail(delivery.id, workItem, recipient)
    }
  }
}

export async function runEscalationCheck(): Promise<{ escalated: number }> {
  const openDeliveries = await db.alertDelivery.findMany({
    where: { status: { in: ['Sent', 'Pending'] } },
    include: { workItem: true },
  })

  let escalated = 0

  for (const delivery of openDeliveries) {
    const alert: AlertInput = {
      id: delivery.workItemId,
      company: delivery.workItem.company ?? '',
      category: inferCategory(delivery.workItem.notes ?? ''),
      severity: priorityToSeverity(delivery.workItem.priority),
      deadlineAt: delivery.workItem.dueDate,
      now: new Date(),
    }

    if (!shouldEscalate(alert, delivery)) continue

    const nextLevel = delivery.escalationLevel + 1
    const candidates = await db.alertRecipient.findMany({
      where: {
        company: delivery.workItem.company ?? '',
        escalationLevel: nextLevel,
        isActive: true,
        isSuppressed: false,
      },
    })

    await db.alertDelivery.update({
      where: { id: delivery.id },
      data: { status: 'Escalated' },
    })

    await db.alertEvent.create({
      data: {
        workItemId: delivery.workItemId,
        deliveryId: delivery.id,
        eventType: 'EscalationTriggered',
        actorType: 'System',
        payload: JSON.stringify({ nextLevel, candidateCount: candidates.length }),
      },
    })

    for (const recipient of candidates) {
      const newDelivery = await db.alertDelivery.create({
        data: {
          workItemId: delivery.workItemId,
          recipientId: recipient.id,
          channel: recipient.preferredChannel as 'Email' | 'Dashboard' | 'Sms' | 'WhatsApp',
          escalationLevel: nextLevel,
        },
      })

      await db.alertEvent.create({
        data: {
          workItemId: delivery.workItemId,
          deliveryId: newDelivery.id,
          recipientId: recipient.id,
          eventType: 'EscalationDeliveryCreated',
          actorType: 'System',
          payload: JSON.stringify({ escalationLevel: nextLevel }),
        },
      })

      if (recipient.preferredChannel === 'Dashboard') {
        await markDeliverySent(newDelivery.id, delivery.workItemId, recipient.id)
      } else if (recipient.preferredChannel === 'Email') {
        await sendEmail(newDelivery.id, delivery.workItem, recipient)
      }
    }

    escalated++
  }

  return { escalated }
}

async function markDeliverySent(
  deliveryId: string,
  workItemId: string,
  recipientId: string,
): Promise<void> {
  await db.alertDelivery.update({
    where: { id: deliveryId },
    data: { status: 'Sent', sentAt: new Date() },
  })
  await db.alertEvent.create({
    data: {
      workItemId,
      deliveryId,
      recipientId,
      eventType: 'DeliverySent',
      actorType: 'System',
      payload: JSON.stringify({ channel: 'Dashboard' }),
    },
  })
}

async function sendEmail(
  deliveryId: string,
  workItem: { id: string; title: string; company: string | null; dueDate?: Date | null; notes?: string | null },
  recipient: { id: string; name: string; email: string | null },
): Promise<void> {
  if (!recipient.email) {
    await db.alertDelivery.update({
      where: { id: deliveryId },
      data: { status: 'Failed', failedAt: new Date(), failureReason: 'No email address' },
    })
    await db.alertEvent.create({
      data: {
        workItemId: workItem.id,
        deliveryId,
        recipientId: recipient.id,
        eventType: 'DeliveryFailed',
        actorType: 'System',
        payload: JSON.stringify({ reason: 'No email address' }),
      },
    })
    return
  }

  const resend = getResend()
  if (!resend) {
    // No API key configured — log and mark sent so it doesn't block workflow
    console.log(
      `[AlertDispatch] EMAIL stub → ${recipient.email} | "${workItem.title}" (${workItem.company}) — set RESEND_API_KEY to send real emails`,
    )
    await db.alertDelivery.update({
      where: { id: deliveryId },
      data: { status: 'Sent', sentAt: new Date() },
    })
    await db.alertEvent.create({
      data: {
        workItemId: workItem.id,
        deliveryId,
        recipientId: recipient.id,
        eventType: 'DeliverySent',
        actorType: 'System',
        payload: JSON.stringify({ channel: 'Email', to: recipient.email, stub: true }),
      },
    })
    return
  }

  try {
    const deadline = workItem.dueDate
      ? new Date(workItem.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'No deadline set'

    await resend.emails.send({
      from: FROM_EMAIL,
      to: recipient.email,
      subject: `[FineGuard Alert] ${workItem.title}`,
      text: buildEmailText({ workItem, recipient, deadline }),
      html: buildEmailHtml({ workItem, recipient, deadline }),
    })

    await db.alertDelivery.update({
      where: { id: deliveryId },
      data: { status: 'Sent', sentAt: new Date() },
    })
    await db.alertEvent.create({
      data: {
        workItemId: workItem.id,
        deliveryId,
        recipientId: recipient.id,
        eventType: 'DeliverySent',
        actorType: 'System',
        payload: JSON.stringify({ channel: 'Email', to: recipient.email }),
      },
    })
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[AlertDispatch] Email failed → ${recipient.email}:`, reason)
    await db.alertDelivery.update({
      where: { id: deliveryId },
      data: { status: 'Failed', failedAt: new Date(), failureReason: reason.slice(0, 500) },
    })
    await db.alertEvent.create({
      data: {
        workItemId: workItem.id,
        deliveryId,
        recipientId: recipient.id,
        eventType: 'DeliveryFailed',
        actorType: 'System',
        payload: JSON.stringify({ reason }),
      },
    })
  }
}

function buildEmailText({
  workItem,
  recipient,
  deadline,
}: {
  workItem: { id: string; title: string; company: string | null; notes?: string | null }
  recipient: { name: string }
  deadline: string
}): string {
  return [
    `Dear ${recipient.name},`,
    '',
    `A compliance alert has been raised for ${workItem.company ?? 'your company'}.`,
    '',
    `Alert: ${workItem.title}`,
    `Deadline: ${deadline}`,
    workItem.notes ? `\nDetails:\n${workItem.notes}` : '',
    '',
    'Please log in to UltraCore SheetOps to acknowledge this alert.',
    '',
    '— FineGuard Compliance System',
  ].join('\n')
}

function buildEmailHtml({
  workItem,
  recipient,
  deadline,
}: {
  workItem: { id: string; title: string; company: string | null; notes?: string | null }
  recipient: { name: string }
  deadline: string
}): string {
  const notes = workItem.notes
    ? `<p style="color:#475569;font-size:14px;white-space:pre-wrap">${workItem.notes}</p>`
    : ''
  return `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1e293b">
  <div style="background:#1e293b;padding:16px 24px;border-radius:8px 8px 0 0">
    <p style="color:#94a3b8;font-size:12px;margin:0;text-transform:uppercase;letter-spacing:.05em">FineGuard Compliance Alert</p>
    <h1 style="color:#fff;font-size:20px;margin:4px 0 0">${workItem.title}</h1>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px">
    <p style="margin:0 0 16px">Dear <strong>${recipient.name}</strong>,</p>
    <p style="margin:0 0 16px;color:#475569">
      A compliance alert has been raised for <strong>${workItem.company ?? 'your company'}</strong>.
    </p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      <tr>
        <td style="padding:8px 12px;background:#f8fafc;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;width:100px;border:1px solid #e2e8f0">Alert</td>
        <td style="padding:8px 12px;font-size:14px;border:1px solid #e2e8f0">${workItem.title}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;background:#f8fafc;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;border:1px solid #e2e8f0">Deadline</td>
        <td style="padding:8px 12px;font-size:14px;font-weight:600;color:#dc2626;border:1px solid #e2e8f0">${deadline}</td>
      </tr>
    </table>
    ${notes}
    <p style="margin:16px 0 0;font-size:13px;color:#64748b">Please log in to UltraCore SheetOps to acknowledge this alert and take any required action.</p>
    <p style="margin:24px 0 0;font-size:12px;color:#94a3b8">— FineGuard Compliance System</p>
  </div>
</body>
</html>`
}

export function inferCategory(notes: string): AlertCategory {
  const n = notes.toLowerCase()
  if (n.includes('confirmation statement') || n.includes('companies house confirm')) return 'CompaniesHouseConfirmation'
  if (n.includes('accounts') || n.includes('companies house account')) return 'CompaniesHouseAccounts'
  if (n.includes('vat') || n.includes('mtd')) return 'VatMtd'
  if (n.includes('paye')) return 'Paye'
  if (n.includes('self assessment') || n.includes('sa100')) return 'SelfAssessment'
  if (n.includes('corporation tax') || n.includes('ct600')) return 'CorporationTax'
  return 'GeneralCompliance'
}

function priorityToSeverity(priority: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (priority === 'Urgent') return 'CRITICAL'
  if (priority === 'High') return 'HIGH'
  if (priority === 'Medium') return 'MEDIUM'
  return 'LOW'
}
