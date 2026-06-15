import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export const runtime = 'nodejs'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}

  if (body.followUpDone !== undefined) {
    if (typeof body.followUpDone !== 'boolean') {
      return NextResponse.json({ error: 'followUpDone must be a boolean' }, { status: 400 })
    }
    updates.followUpDone = body.followUpDone
  }

  if (body.summary !== undefined) {
    if (typeof body.summary !== 'string' || !body.summary.trim()) {
      return NextResponse.json({ error: 'summary must be a non-empty string' }, { status: 400 })
    }
    updates.summary = body.summary.trim()
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  // Verify log exists
  try {
    const existing = await db.outreachLog.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  let updated
  try {
    updated = await db.outreachLog.update({
      where: { id: params.id },
      data: updates,
    })
  } catch {
    return NextResponse.json({ error: 'Could not update outreach log' }, { status: 503 })
  }

  return NextResponse.json(updated)
}
