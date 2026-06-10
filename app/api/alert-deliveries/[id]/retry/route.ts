import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
async function sendAlertEmail(
  _deliveryId: string,
  _workItem: unknown,
  _recipient: unknown,
  _ackToken?: string
) {
  // TODO: wire to real email sender once path is confirmed.
  return
}

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

  const newDelivery = await db.alertDelivery.create({
    data: {
      workItemId: delivery.workItemId,
      recipientId: delivery.recipientId,
      channel: delivery.channel,
      status: 'Pending',
    },
  })

  if (delivery.channel === 'Dashboard') {
    await db.activityLog.create({
      data: {
        workItemId: delivery.workItemId,
        person: session.person,
        eventType: 'ActionCreated',
        summary: `Retried dashboard alert delivery ${newDelivery.id}`,
      },
    })
  } else if (delivery.channel === 'Email') {
    await sendAlertEmail(
      newDelivery.id,
      delivery.workItem,
      delivery.recipient,
      newDelivery.ackToken ?? undefined
    )
  }

  const finalDelivery = await db.alertDelivery.findUnique({
    where: { id: newDelivery.id },
  })

  return NextResponse.json(finalDelivery ?? newDelivery, { status: 201 })
}
