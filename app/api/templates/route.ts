import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { isTemplateCategory, type TemplateCategory } from '@/lib/template-enums'
import { extractVariables } from '@/lib/template-utils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function parseCategory(value: unknown): TemplateCategory | null {
  if (value === undefined || value === null || value === '') return 'General'
  return isTemplateCategory(value) ? value : null
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const templates = await db.template.findMany({
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(templates)
  } catch {
    return NextResponse.json({ error: 'Could not load templates' }, { status: 503 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { name?: unknown; useCase?: unknown; body?: unknown; category?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const useCase = typeof body.useCase === 'string' ? body.useCase.trim() : ''
  const bodyText = typeof body.body === 'string' ? body.body.trim() : ''
  const category = parseCategory(body.category)

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })
  if (!bodyText) return NextResponse.json({ error: 'body is required' }, { status: 400 })
  if (!category) return NextResponse.json({ error: 'Invalid category' }, { status: 400 })

  const variables = extractVariables(bodyText)
  const draftData = {
    useCase,
    body: bodyText,
    approved: false,
    pendingReview: false,
    approvedBy: null,
    approvedAt: null,
    reviewNote: null,
    category,
    variables,
  }

  try {
    const existing = await db.template.findFirst({ where: { name } })
    const template = existing
      ? await db.template.update({
          where: { id: existing.id },
          data: draftData,
        })
      : await db.template.create({
          data: { name, ...draftData },
        })
    return NextResponse.json(template, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Could not save template' }, { status: 503 })
  }
}
