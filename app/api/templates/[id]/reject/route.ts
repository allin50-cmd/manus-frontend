import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.person !== 'George') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = params

  let body: { note?: unknown }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const note = typeof body.note === 'string' ? body.note.trim() : ''

  const existing = await db.template.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const updated = await db.template.update({
      where: { id },
      data: {
        approved: false,
        pendingReview: false,
        reviewNote: note || null,
      },
    })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Could not reject template' }, { status: 503 })
  }
}
