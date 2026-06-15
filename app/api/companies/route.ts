import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const companies = await db.company.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    })
    return NextResponse.json({ companies })
  } catch {
    return NextResponse.json({ error: 'Could not load companies' }, { status: 503 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { name, companiesHouseNumber, incorporationDate, jurisdiction } = body

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  let company
  try {
    company = await db.company.create({
      data: {
        name: (name as string).trim(),
        companiesHouseNumber: (companiesHouseNumber as string) || null,
        incorporationDate: incorporationDate ? new Date(incorporationDate as string) : null,
        jurisdiction: (jurisdiction as string) || 'UK',
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('Unique constraint')) {
      return NextResponse.json({ error: 'A company with that name already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Could not create company' }, { status: 503 })
  }

  return NextResponse.json(company, { status: 201 })
}
