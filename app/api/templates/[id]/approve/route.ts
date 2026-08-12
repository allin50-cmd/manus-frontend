import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { extractVariables } from '@/lib/template-utils'

export const runtime = 'nodejs'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.person !== 'George') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let existing: { body: string; approved: boolean; pendingReview: boolean } | null = null
  try {
    existing = await db.template.findUnique({
      where: { id: params.id },
      select: { body: true, approved: true, pendingReview: true },
    })
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!existing.pendingReview) {
    return NextResponse.json({ error: 'Template is not pending review' }, { status: 409 })
  }

  const variables = extractVariables(existing.body)
  const approvedAt = new Date()

  try {
    const updated = await db.$transaction(async (tx) => {
      const result = await tx.template.updateMany({
        where: {
          id: params.id,
          approved: existing.approved,
          pendingReview: true,
        },
        data: {
          approved: true,
          pendingReview: false,
          approvedBy: session.person,
          approvedAt,
          reviewNote: null,
          variables,
        },
      })

      if (result.count !== 1) return null
      return tx.template.findUniqueOrThrow({ where: { id: params.id } })
    })

    if (!updated) {
      return NextResponse.json(
        { error: 'Template changed before approval could be applied' },
        { status: 409 },
      )
    }

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Could not approve template' }, { status: 503 })
  }
}
