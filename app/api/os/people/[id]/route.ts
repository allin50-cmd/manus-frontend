import { NextRequest, NextResponse } from 'next/server'
import { getDb, osPeople } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  const [person] = await db.select().from(osPeople).where(eq(osPeople.id, params.id)).limit(1)

  if (!person) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
  }

  return NextResponse.json(person)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const db = await getDb()

  const [person] = await db
    .update(osPeople)
    .set({
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      category: body.category || 'Client',
      company: body.company || null,
      notes: body.notes || null,
      updatedAt: new Date(),
    })
    .where(eq(osPeople.id, params.id))
    .returning()

  if (!person) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
  }

  return NextResponse.json(person)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  const [person] = await db.delete(osPeople).where(eq(osPeople.id, params.id)).returning()

  if (!person) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}
