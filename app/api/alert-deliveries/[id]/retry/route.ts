import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sendAlertEmail } from '@/lib/alert-dispatch'
import { randomUUID } from 'crypto'

const RETRYABLE_STATUSES = new Set(['Failed', 'Pending'])

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { id } = params

  const delivery = await db.alertDelivery.findUnique({
    where: { id },
    include: { workItem: true, recipient: true },
  })

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

  if (delivery.channel === 'Dashboard') {
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
