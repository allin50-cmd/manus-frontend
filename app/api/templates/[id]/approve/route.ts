import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { extractVariables } from '@/lib/template-utils'

export const runtime = 'nodejs'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.person !== 'George') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = params

  let existing
  try {
    existing = await db.template.findUnique({ where: { id } })
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const variables = extractVariables(existing.body)

  try {
    const updated = await db.template.update({
      where: { id },
      data: {
        approved: true,
        pendingReview: false,
        approvedBy: session.person,
        approvedAt: new Date(),
        variables,
      },
    })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Could not approve template' }, { status: 503 })
  }
}
