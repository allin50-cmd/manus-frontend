import { NextRequest, NextResponse } from 'next/server'
import { getDb, osPeople } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { desc } from 'drizzle-orm'
import { trackEvent } from '@/lib/ut-tracker'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  const people = await db.select().from(osPeople).orderBy(desc(osPeople.createdAt)).limit(200)
  return NextResponse.json(people)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const db = await getDb()
  const [person] = await db
    .insert(osPeople)
    .values({
      name: body.name,
      phone: body.phone || null,
      email: body.email || null,
      company: body.company || null,
      role: body.role || null,
      category: body.category || 'Client',
      avatarInitials: body.avatarInitials || null,
      notes: body.notes || null,
    })
    .returning()

  await trackEvent({ eventType: 'contact_created', userId: session.person })
  return NextResponse.json(person, { status: 201 })
}
