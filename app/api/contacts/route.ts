import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  await requireAuth()
  const contacts = await db.contact.findMany({
    where: { isActive: true },
    include: { company: true },
    orderBy: [{ company: { name: 'asc' } }, { isPrimary: 'desc' }, { name: 'asc' }],
  })
  return NextResponse.json(contacts)
}

export async function POST(req: NextRequest) {
  await requireAuth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { name, companyId, role, email, phone, isPrimary, notes } = body

  if (typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }
  if (!companyId) return NextResponse.json({ error: 'Company is required' }, { status: 400 })

  let contact
  try {
    contact = await db.contact.create({
      data: { name: name.trim(), companyId, role, email, phone, isPrimary: !!isPrimary, notes },
      include: { company: true },
    })
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code
    if (code === 'P2003') return NextResponse.json({ error: 'Company not found' }, { status: 400 })
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  return NextResponse.json(contact, { status: 201 })
}
