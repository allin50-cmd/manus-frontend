import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { ALERT_CATEGORIES } from '@/lib/alert-recipient-selector'
import { RecipientRole, DeliveryChannel } from '@prisma/client'

const VALID_ROLES: RecipientRole[] = ['Director', 'Accountant', 'CompanySecretary', 'Admin', 'ComplianceManager', 'ExternalAdviser', 'Custom']
const VALID_CHANNELS: DeliveryChannel[] = ['Email', 'Dashboard', 'Sms', 'WhatsApp']

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const company = req.nextUrl.searchParams.get('company')
  const where = { isActive: true, ...(company ? { company } : {}) }

  const recipients = await db.alertRecipient.findMany({
    where,
    orderBy: [{ company: 'asc' }, { escalationLevel: 'asc' }, { name: 'asc' }],
  })

  return NextResponse.json(recipients)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const {
    company,
    name,
    email,
    phone,
    role,
    preferredChannel = 'Dashboard',
    alertCategories = [],
    escalationLevel = 1,
  } = body

  if (!company || !name || !role) {
    return NextResponse.json({ error: 'company, name, and role are required' }, { status: 400 })
  }
  if (!VALID_ROLES.includes(role as RecipientRole)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }
  if (preferredChannel && !VALID_CHANNELS.includes(preferredChannel as DeliveryChannel)) {
    return NextResponse.json({ error: 'Invalid preferredChannel' }, { status: 400 })
  }

  const invalidCats = alertCategories.filter((c: string) => !ALERT_CATEGORIES.includes(c as never))
  if (invalidCats.length > 0) {
    return NextResponse.json(
      { error: `Unknown alert categories: ${invalidCats.join(', ')}` },
      { status: 400 },
    )
  }

  const recipient = await db.alertRecipient.create({
    data: {
      company,
      name,
      email: email || null,
      phone: phone || null,
      role,
      preferredChannel,
      alertCategories,
      escalationLevel: Number(escalationLevel),
    },
  })

  await db.alertEvent.create({
    data: {
      recipientId: recipient.id,
      eventType: 'RecipientSelected',
      actorType: 'User',
      actorId: session.person,
      payload: JSON.stringify({ action: 'created', company, name }),
    },
  })

  return NextResponse.json(recipient, { status: 201 })
}
