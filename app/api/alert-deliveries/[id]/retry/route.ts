import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sendAlertEmail, markDeliverySent } from '@/lib/alert-dispatch'
import { randomUUID } from 'crypto'

// Only a delivery that actually failed may be retried. Pending deliveries are still
// in flight and Sent/Acknowledged ones already succeeded.
const RETRYABLE_STATUSES = new Set(['Failed'])

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { id } = params

  let delivery
  try {
    delivery = await db.alertDelivery.findUnique({
      where: { id },
      include: { workItem: true, recipient: true },
    })
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
  if (!delivery) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Prevent retrying a delivery that already succeeded or was acknowledged.
  if (!RETRYABLE_STATUSES.has(delivery.status)) {
    return NextResponse.json(
      { error: `Cannot retry a delivery with status '${delivery.status}'` },
      { status: 409 },
    )
  }

  let newDelivery
  try {
    newDelivery = await db.alertDelivery.create({
      data: {
        workItemId: delivery.workItemId,
        recipientId: delivery.recipientId,
        channel: delivery.channel,
        status: 'Pending',
        escalationLevel: delivery.escalationLevel,
        ackToken: randomUUID(),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Could not create retry delivery' }, { status: 503 })
  }

  // Audit every retry, regardless of channel.
  await db.alertEvent.create({
    data: {
      workItemId: delivery.workItemId,
      deliveryId: newDelivery.id,
      recipientId: delivery.recipientId,
      eventType: 'DeliveryCreated',
      actorType: 'User',
      actorId: session.person,
      payload: JSON.stringify({
        action: 'retry',
        retryOf: delivery.id,
        channel: delivery.channel,
        escalationLevel: newDelivery.escalationLevel,
      }),
    },
  }).catch(() => {})

  if (delivery.channel === 'Dashboard') {
    // Matches the original dispatch path (lib/alert-dispatch.ts): a Dashboard
    // delivery is considered delivered as soon as it's created, so it must be
    // marked Sent here too — otherwise it sits at Pending forever and can
    // never reach runEscalationCheck(), which only escalates Sent deliveries.
    await markDeliverySent(newDelivery.id, delivery.workItemId, delivery.recipientId)
    await db.activityLog.create({
      data: {
        workItemId: delivery.workItemId,
        person: session.person,
        eventType: 'ActionCreated',
        summary: `Retried dashboard alert delivery ${newDelivery.id}`,
      },
    }).catch(() => {})
  } else if (delivery.channel === 'Email') {
    try {
      await sendAlertEmail(
        newDelivery.id,
        delivery.workItem,
        delivery.recipient,
        newDelivery.ackToken ?? undefined,
      )
    } catch {
      // delivery stays Pending; caller can retry again
    }
  }

  const finalDelivery = await db.alertDelivery.findUnique({ where: { id: newDelivery.id } })
  return NextResponse.json(finalDelivery ?? newDelivery, { status: 201 })
}
