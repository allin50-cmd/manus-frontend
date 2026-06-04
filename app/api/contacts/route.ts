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
  const body = await req.json()
  const { name, companyId, role, email, phone, isPrimary, notes } = body

  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!companyId) return NextResponse.json({ error: 'Company is required' }, { status: 400 })

  const contact = await db.contact.create({
    data: { name: name.trim(), companyId, role, email, phone, isPrimary: !!isPrimary, notes },
    include: { company: true },
  })

  return NextResponse.json(contact, { status: 201 })
}
