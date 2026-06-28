import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { ALERT_CATEGORIES } from '@/lib/alert-recipient-selector'
import { RecipientRole, DeliveryChannel } from '@/lib/types'

const VALID_ROLES: RecipientRole[] = ['Director', 'Accountant', 'CompanySecretary', 'Admin', 'ComplianceManager', 'ExternalAdviser', 'Custom']
const VALID_CHANNELS: DeliveryChannel[] = ['Email', 'Dashboard', 'Sms', 'WhatsApp']

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

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { name, email, phone, role, preferredChannel, alertCategories, escalationLevel, isActive } = body

  if (role !== undefined && !VALID_ROLES.includes(role as RecipientRole)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }
  if (preferredChannel !== undefined && !VALID_CHANNELS.includes(preferredChannel as DeliveryChannel)) {
    return NextResponse.json({ error: 'Invalid preferredChannel' }, { status: 400 })
  }

  if (alertCategories !== undefined) {
    if (!Array.isArray(alertCategories)) {
      return NextResponse.json({ error: 'alertCategories must be an array' }, { status: 400 })
    }
    const invalid = alertCategories.filter((c: string) => !ALERT_CATEGORIES.includes(c as never))
    if (invalid.length > 0) {
      return NextResponse.json({ error: `Unknown categories: ${invalid.join(', ')}` }, { status: 400 })
    }
  }

  let parsedEscalationLevel: number | undefined
  if (escalationLevel !== undefined) {
    parsedEscalationLevel = Number(escalationLevel)
    if (!Number.isInteger(parsedEscalationLevel) || parsedEscalationLevel < 1) {
      return NextResponse.json({ error: 'escalationLevel must be a positive integer' }, { status: 400 })
    }
  }

  let updated
  try {
    updated = await db.alertRecipient.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email: email || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(role !== undefined && { role: role as RecipientRole }),
        ...(preferredChannel !== undefined && { preferredChannel: preferredChannel as DeliveryChannel }),
        ...(alertCategories !== undefined && { alertCategories }),
        ...(parsedEscalationLevel !== undefined && { escalationLevel: parsedEscalationLevel }),
        ...(isActive !== undefined && { isActive }),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Could not update recipient' }, { status: 503 })
  }

  await db.alertEvent.create({
    data: {
      recipientId: params.id,
      eventType: 'RecipientUpdated',
      actorType: 'User',
      actorId: session.person,
      payload: JSON.stringify({ action: 'updated', changes: Object.keys(body) }),
    },
  }).catch(() => {})

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const recipient = await db.alertRecipient.findUnique({ where: { id: params.id } })
  if (!recipient) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let updated
  try {
    updated = await db.alertRecipient.update({
      where: { id: params.id },
      data: { isActive: false },
    })
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  await db.alertEvent.create({
    data: {
      recipientId: params.id,
      eventType: 'RecipientDeactivated',
      actorType: 'User',
      actorId: session.person,
      payload: JSON.stringify({ action: 'deactivated' }),
    },
  }).catch(() => {})

  return NextResponse.json(updated)
}
