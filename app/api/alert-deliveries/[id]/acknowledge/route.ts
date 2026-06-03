import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const delivery = await db.alertDelivery.findUnique({ where: { id: params.id } })
  if (!delivery) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (delivery.status === 'Acknowledged') {
    return NextResponse.json({ error: 'Already acknowledged' }, { status: 409 })
  }

  const updated = await db.alertDelivery.update({
    where: { id: params.id },
    data: { status: 'Acknowledged', acknowledgedAt: new Date() },
  })

  await db.alertEvent.create({
    data: {
      workItemId: delivery.workItemId,
      deliveryId: params.id,
      recipientId: delivery.recipientId,
      eventType: 'AlertAcknowledged',
      actorType: 'User',
      actorId: session.person,
      payload: JSON.stringify({ acknowledgedBy: session.person }),
    },
  })

  return NextResponse.json(updated)
}
