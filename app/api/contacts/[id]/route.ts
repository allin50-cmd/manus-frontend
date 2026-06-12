import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { name, companyId, role, email, phone, isPrimary, notes } = body

  if (name !== undefined && !name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  let contact
  try {
    contact = await db.contact.update({
      where: { id: params.id, isActive: true },
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
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code
    if (code === 'P2025') return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  return NextResponse.json(contact)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth()
  try {
    await db.contact.update({
      where: { id: params.id, isActive: true },
      data: { isActive: false },
    })
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code
    if (code === 'P2025') return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
  return NextResponse.json({ ok: true })
}
