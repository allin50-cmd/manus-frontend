import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { ALERT_CATEGORIES } from '@/lib/alert-recipient-selector'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const recipient = await db.alertRecipient.findUnique({ where: { id: params.id } })
  if (!recipient) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(recipient)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const recipient = await db.alertRecipient.findUnique({ where: { id: params.id } })
  if (!recipient) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const {
    name,
    email,
    phone,
    role,
    preferredChannel,
    alertCategories,
    escalationLevel,
    isActive,
  } = body

  if (alertCategories !== undefined) {
    const invalid = alertCategories.filter((c: string) => !ALERT_CATEGORIES.includes(c as never))
    if (invalid.length > 0) {
      return NextResponse.json({ error: `Unknown categories: ${invalid.join(', ')}` }, { status: 400 })
    }
  }

  const updated = await db.alertRecipient.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email: email || null }),
      ...(phone !== undefined && { phone: phone || null }),
      ...(role !== undefined && { role }),
      ...(preferredChannel !== undefined && { preferredChannel }),
      ...(alertCategories !== undefined && { alertCategories }),
      ...(escalationLevel !== undefined && { escalationLevel: Number(escalationLevel) }),
      ...(isActive !== undefined && { isActive }),
    },
  })

  await db.alertEvent.create({
    data: {
      recipientId: params.id,
      eventType: 'RecipientSelected',
      actorType: 'User',
      actorId: session.person,
      payload: JSON.stringify({ action: 'updated', changes: body }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const recipient = await db.alertRecipient.findUnique({ where: { id: params.id } })
  if (!recipient) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Soft-delete: mark inactive rather than delete (preserves audit history)
  const updated = await db.alertRecipient.update({
    where: { id: params.id },
    data: { isActive: false },
  })

  await db.alertEvent.create({
    data: {
      recipientId: params.id,
      eventType: 'RecipientSelected',
      actorType: 'User',
      actorId: session.person,
      payload: JSON.stringify({ action: 'deactivated' }),
    },
  })

  return NextResponse.json(updated)
}
