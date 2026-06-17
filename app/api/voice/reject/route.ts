import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/db'
import { getSession } from '../../../../lib/auth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, reason } = await req.json().catch(() => ({}))
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  // Scope to the creator so one user cannot discard another's intake.
  const intake = await db.voiceIntake.findFirst({ where: { id, createdBy: session.person } })
  if (!intake) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (intake.status === 'APPROVED') {
    return NextResponse.json({ error: 'Cannot reject an approved intake' }, { status: 409 })
  }

  try {
    const updated = await db.voiceIntake.update({
      where: { id },
      // Discard the audio blob on rejection so it doesn't linger in the DB.
      data: { status: 'REJECTED', reviewNotes: reason || null, audioData: null },
    })
    return NextResponse.json({ id: updated.id, status: updated.status })
  } catch {
    return NextResponse.json({ error: 'Could not update intake' }, { status: 503 })
  }
}
