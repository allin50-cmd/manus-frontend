import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '../../../../../lib/auth'
import { db } from '../../../../../lib/db'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let recipient
  try {
    recipient = await db.alertRecipient.findUnique({ where: { id: params.id } })
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
  if (!recipient) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { reason } = await req.json().catch(() => ({}) as any)
  const safeReason = typeof reason === 'string' ? reason : null

  try {
    const updated = await db.alertRecipient.update({
      where: { id: params.id },
      data: { isSuppressed: true, suppressionReason: safeReason || null },
    })

    await db.alertEvent.create({
      data: {
        recipientId: params.id,
        eventType: 'RecipientSuppressed',
        actorType: 'User',
        actorId: session.person,
        payload: JSON.stringify({ reason: safeReason }),
      },
    }).catch(() => {})

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Could not suppress recipient' }, { status: 503 })
  }
}
