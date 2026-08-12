import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
  if (existing.pendingReview) {
    return NextResponse.json({ error: 'Template is already pending review' }, { status: 409 })
  }

  try {
    const updated = await db.$transaction(async (tx) => {
      const result = await tx.template.updateMany({
        where: {
          id: params.id,
          approved: existing.approved,
          pendingReview: false,
        },
        data: {
          approved: false,
          pendingReview: true,
          approvedBy: null,
          approvedAt: null,
          reviewNote: null,
        },
      })

      if (result.count !== 1) return null
      return tx.template.findUniqueOrThrow({ where: { id: params.id } })
    })

    if (!updated) {
      return NextResponse.json(
        { error: 'Template changed before it could be submitted for review' },
        { status: 409 },
      )
    }

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Could not submit template for review' }, { status: 503 })
  }
}
