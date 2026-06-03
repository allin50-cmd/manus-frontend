import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendAlertEmail } from '@/lib/alert-dispatch'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const delivery = await db.alertDelivery.findUnique({
    where: { id: params.id },
    include: { workItem: true, recipient: true },
  })
  if (!delivery) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (delivery.status !== 'Failed') {
    return NextResponse.json(
      { error: `Cannot retry a delivery with status '${delivery.status}'` },
      { status: 409 },
    )
  }

  // Create a fresh delivery record — never mutate old delivery history
  const newDelivery = await db.alertDelivery.create({
    data: {
      workItemId: delivery.workItemId,
      recipientId: delivery.recipientId,
      channel: delivery.channel,
      escalationLevel: delivery.escalationLevel,
      status: 'Pending',
      ackToken: randomUUID(),
    },
  })

  await db.alertEvent.create({
    data: {
      workItemId: delivery.workItemId,
      deliveryId: newDelivery.id,
      recipientId: delivery.recipientId,
      eventType: 'DeliveryCreated',
      actorType: 'User',
      actorId: session.person,
      payload: JSON.stringify({ action: 'retry', originalDeliveryId: params.id }),
    },
  })

  // Attempt delivery via the same path as initial dispatch
  if (delivery.channel === 'Dashboard') {
    await db.alertDelivery.update({
      where: { id: newDelivery.id },
      data: { status: 'Sent', sentAt: new Date() },
    })
    await db.alertEvent.create({
      data: {
        workItemId: delivery.workItemId,
        deliveryId: newDelivery.id,
        recipientId: delivery.recipientId,
        eventType: 'DeliverySent',
        actorType: 'System',
        payload: JSON.stringify({ channel: 'Dashboard' }),
      },
    })
  } else if (delivery.channel === 'Email') {
    await sendAlertEmail(newDelivery.id, delivery.workItem, delivery.recipient, newDelivery.ackToken ?? undefined)
  }

  return NextResponse.json(newDelivery, { status: 201 })
}
