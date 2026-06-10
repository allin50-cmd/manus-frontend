import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, reason } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const intake = await db.voiceIntake.findUnique({ where: { id } })
  if (!intake) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (intake.status === 'APPROVED') {
    return NextResponse.json({ error: 'Cannot reject an approved intake' }, { status: 409 })
  }

  const updated = await db.voiceIntake.update({
    where: { id },
    data: { status: 'REJECTED', reviewNotes: reason || null },
  })

  return NextResponse.json({ id: updated.id, status: updated.status })
}
