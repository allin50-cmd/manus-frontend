import { NextRequest, NextResponse } from 'next/server'
import { getDb, builderBigJobsLeads } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { jwtVerify } from 'jose'

export const dynamic = 'force-dynamic'

const VALID_STATUSES = ['new', 'qualified', 'contacted', 'site_visit_booked', 'quoted', 'won', 'lost', 'not_suitable']
const VALID_ASSIGNEES = ['Dagon', 'Alissa', 'George', '']

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = req.cookies.get('session')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await jwtVerify(token, new TextEncoder().encode(jwtSecret))
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const updates: Record<string, unknown> = { updatedAt: new Date() }

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    updates.status = body.status
  }

  if (body.assignedTo !== undefined) {
    if (!VALID_ASSIGNEES.includes(body.assignedTo)) {
      return NextResponse.json({ error: 'Invalid assignee' }, { status: 400 })
    }
    updates.assignedTo = body.assignedTo || null
  }

  if (body.notes !== undefined) {
    updates.notes = String(body.notes).trim() || null
  }

  const db = await getDb()
  await db.update(builderBigJobsLeads).set(updates).where(eq(builderBigJobsLeads.id, params.id))

  return NextResponse.json({ ok: true })
}
