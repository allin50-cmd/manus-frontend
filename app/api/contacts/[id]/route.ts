import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth()
  const body = await req.json()
  const { name, companyId, role, email, phone, isPrimary, notes } = body

  if (name !== undefined && !name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const contact = await db.contact.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(companyId !== undefined && { companyId }),
      ...(role !== undefined && { role }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(isPrimary !== undefined && { isPrimary }),
      ...(notes !== undefined && { notes }),
    },
    include: { company: true },
  })

  return NextResponse.json(contact)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth()
  await db.contact.update({
    where: { id: params.id },
    data: { isActive: false },
  })
  return NextResponse.json({ ok: true })
}
