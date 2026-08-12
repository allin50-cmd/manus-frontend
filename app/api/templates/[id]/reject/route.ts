import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

const MAX_REVIEW_NOTE_LENGTH = 1000

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.person !== 'George') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { note?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (body.note !== undefined && typeof body.note !== 'string') {
    return NextResponse.json({ error: 'Invalid review note' }, { status: 400 })
  }

  const note = typeof body.note === 'string' ? body.note.trim() : ''
  if (note.length > MAX_REVIEW_NOTE_LENGTH) {
    return NextResponse.json({ error: 'Review note is too long' }, { status: 400 })
  }

  let existing: { approved: boolean; pendingReview: boolean } | null = null
  try {
    existing = await db.template.findUnique({
      where: { id: params.id },
      select: { approved: true, pendingReview: true },
    })
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!existing.pendingReview) {
    return NextResponse.json({ error: 'Template is not pending review' }, { status: 409 })
  }

  try {
    const updated = await db.$transaction(async (tx) => {
      const result = await tx.template.updateMany({
        where: {
          id: params.id,
          approved: existing.approved,
          pendingReview: true,
        },
        data: {
          approved: false,
          pendingReview: false,
          approvedBy: null,
          approvedAt: null,
          reviewNote: note || null,
        },
      })

      if (result.count !== 1) return null
      return tx.template.findUniqueOrThrow({ where: { id: params.id } })
    })

    if (!updated) {
      return NextResponse.json(
        { error: 'Template changed before rejection could be applied' },
        { status: 409 },
      )
    }

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Could not reject template' }, { status: 503 })
  }
}
