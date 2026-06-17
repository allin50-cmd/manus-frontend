import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../lib/auth'
import { db } from '../../../lib/db'

export async function GET() {
  await requireAuth()

  try {
    const companies = await db.company.findMany({
      orderBy: { name: 'asc' },
      include: { contacts: true },
    })

    return NextResponse.json(companies)
  } catch {
    return NextResponse.json({ error: 'Could not load companies' }, { status: 503 })
  }
}

export async function POST(req: NextRequest) {
  await requireAuth()

  let body: { name?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  try {
    const company = await db.company.upsert({
      where: { name },
      create: { name },
      update: {},
    })

    return NextResponse.json(company, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Could not save company' }, { status: 503 })
  }
}
