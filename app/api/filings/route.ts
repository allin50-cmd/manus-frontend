import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { FilingStatus, FilingCategory, FilingSource } from '@prisma/client'

export const runtime = 'nodejs'

const VALID_STATUSES = new Set<string>(Object.values(FilingStatus))
const VALID_CATEGORIES = new Set<string>(Object.values(FilingCategory))
const VALID_SOURCES = new Set<string>(Object.values(FilingSource))

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const where: Record<string, unknown> = {}

  // ?status=OVERDUE,AT_RISK (comma-separated)
  const statusParam = searchParams.get('status')
  if (statusParam) {
    const statuses = statusParam.split(',').map((s) => s.trim())
    const invalid = statuses.find((s) => !VALID_STATUSES.has(s))
    if (invalid) return NextResponse.json({ error: `Invalid status: ${invalid}` }, { status: 400 })
    where.status = { in: statuses as FilingStatus[] }
  }

  const companyId = searchParams.get('companyId')
  if (companyId) where.companyId = companyId

  const category = searchParams.get('category')
  if (category) {
    if (!VALID_CATEGORIES.has(category)) return NextResponse.json({ error: `Invalid category: ${category}` }, { status: 400 })
    where.category = category as FilingCategory
  }

  const source = searchParams.get('source')
  if (source) {
    if (!VALID_SOURCES.has(source)) return NextResponse.json({ error: `Invalid source: ${source}` }, { status: 400 })
    where.source = source as FilingSource
  }

  const dueBefore = searchParams.get('dueBefore')
  const dueAfter = searchParams.get('dueAfter')
  if (dueBefore || dueAfter) {
    const dueDateFilter: Record<string, Date> = {}
    if (dueBefore) {
      const d = new Date(dueBefore)
      if (isNaN(d.getTime())) return NextResponse.json({ error: 'Invalid dueBefore date' }, { status: 400 })
      dueDateFilter.lt = d
    }
    if (dueAfter) {
      const d = new Date(dueAfter)
      if (isNaN(d.getTime())) return NextResponse.json({ error: 'Invalid dueAfter date' }, { status: 400 })
      dueDateFilter.gt = d
    }
    where.dueDate = dueDateFilter
  }

  try {
    const filings = await db.filing.findMany({
      where,
      include: {
        company: { select: { id: true, name: true } },
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    })
    return NextResponse.json(filings)
  } catch {
    return NextResponse.json({ error: 'Could not load filings' }, { status: 503 })
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

  const { companyId, category, title, statutoryReference, description, dueDate, periodStart, periodEnd, isRecurring, recurrenceRule } = body

  if (!companyId || typeof companyId !== 'string') {
    return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
  }
  if (!category || typeof category !== 'string') {
    return NextResponse.json({ error: 'category is required' }, { status: 400 })
  }
  if (!VALID_CATEGORIES.has(category)) {
    return NextResponse.json({ error: `Invalid category: ${category}` }, { status: 400 })
  }
  if (!title || typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }
  if (!dueDate) {
    return NextResponse.json({ error: 'dueDate is required' }, { status: 400 })
  }
  const dueDateParsed = new Date(dueDate as string)
  if (isNaN(dueDateParsed.getTime())) {
    return NextResponse.json({ error: 'Invalid dueDate' }, { status: 400 })
  }

  // Validate company exists
  let company
  try {
    company = await db.company.findUnique({ where: { id: companyId } })
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  let filing
  try {
    filing = await db.filing.create({
      data: {
        companyId,
        category: category as FilingCategory,
        title: (title as string).trim(),
        statutoryReference: (statutoryReference as string) || null,
        description: (description as string) || null,
        dueDate: dueDateParsed,
        periodStart: periodStart ? new Date(periodStart as string) : null,
        periodEnd: periodEnd ? new Date(periodEnd as string) : null,
        isRecurring: (isRecurring as boolean) ?? false,
        recurrenceRule: (recurrenceRule as string) || null,
        source: 'MANUAL',
      },
      include: {
        company: { select: { id: true, name: true } },
      },
    })
  } catch {
    return NextResponse.json({ error: 'Could not create filing' }, { status: 503 })
  }

  return NextResponse.json(filing, { status: 201 })
}
