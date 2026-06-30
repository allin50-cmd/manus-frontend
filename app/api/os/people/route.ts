import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getDb, osPeople } from '@/lib/db'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  await requireAuth()
  const db = getDb()
  const companyId = req.nextUrl.searchParams.get('companyId')

  if (!companyId) {
    return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
  }

  try {
    const people = await db.select().from(osPeople).where(eq(osPeople.companyId, companyId))
    return NextResponse.json(people)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch people' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  await requireAuth()
  const db = getDb()
  let body: { companyId: string; firstName: string; lastName: string; email?: string; phone?: string; title?: string; department?: string; notes?: string }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { companyId, firstName, lastName, email, phone, title, department, notes } = body

  if (!companyId?.trim()) return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
  if (!firstName?.trim()) return NextResponse.json({ error: 'firstName is required' }, { status: 400 })
  if (!lastName?.trim()) return NextResponse.json({ error: 'lastName is required' }, { status: 400 })

  try {
    const person = await db.insert(osPeople).values({
      companyId,
      firstName,
      lastName,
      email: email || null,
      phone: phone || null,
      title: title || null,
      department: department || null,
      notes: notes || null,
    }).returning()

    return NextResponse.json(person[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create person' }, { status: 500 })
  }
}
