import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = params

  const existing = await db.template.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const updated = await db.template.update({
      where: { id },
      data: { pendingReview: true },
    })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Could not submit template for review' }, { status: 503 })
  }
}
