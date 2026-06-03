import { db } from '@/lib/db'
import {
  selectRecipientsForAlert,
  shouldEscalate,
  type AlertCategory,
  type AlertInput,
} from '@/lib/alert-recipient-selector'
import type { WorkItem } from '@prisma/client'

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

  // Log excluded routing decisions
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

  // Create deliveries for selected recipients
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

    // Send through the chosen channel
    if (recipient.preferredChannel === 'Dashboard') {
      await markDeliverySent(delivery.id, workItem.id, recipient.id)
    } else if (recipient.preferredChannel === 'Email') {
      await sendEmailNotification(delivery.id, workItem, recipient)
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
        await sendEmailNotification(newDelivery.id, delivery.workItem, recipient)
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

async function sendEmailNotification(
  deliveryId: string,
  workItem: { id: string; title: string; company: string | null },
  recipient: { id: string; email: string | null },
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

  // Stub: log to console. Replace with real mailer when SMTP is configured.
  console.log(
    `[AlertDispatch] EMAIL → ${recipient.email} | Alert: "${workItem.title}" (${workItem.company})`,
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
      payload: JSON.stringify({ channel: 'Email', to: recipient.email }),
    },
  })
}

function inferCategory(notes: string): AlertCategory {
  const n = notes.toLowerCase()
  if (n.includes('confirmation statement') || n.includes('companies house confirm')) return 'CompaniesHouseConfirmation'
  if (n.includes('accounts') || n.includes('companies house account')) return 'CompaniesHouseAccounts'
  if (n.includes('vat') || n.includes('mtd')) return 'VatMtd'
  if (n.includes('paye')) return 'Paye'
  if (n.includes('self assessment') || n.includes('sa100')) return 'SelfAssessment'
  if (n.includes('corporation tax') || n.includes('ct600')) return 'CorporationTax'
  return 'GeneralCompliance'
}

function priorityToSeverity(
  priority: string,
): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (priority === 'Urgent') return 'CRITICAL'
  if (priority === 'High') return 'HIGH'
  if (priority === 'Medium') return 'MEDIUM'
  return 'LOW'
}
