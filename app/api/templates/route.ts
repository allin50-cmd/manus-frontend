import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { extractVariables } from '@/lib/template-utils'
import { TemplateCategory } from '@prisma/client'

export const dynamic = 'force-dynamic'

const VALID_CATEGORIES = new Set<string>(Object.values(TemplateCategory))

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

  let body: { name?: unknown; useCase?: unknown; body?: unknown; approved?: unknown; category?: unknown }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const useCase = typeof body.useCase === 'string' ? body.useCase.trim() : ''
  const bodyText = typeof body.body === 'string' ? body.body.trim() : ''
  const categoryRaw = typeof body.category === 'string' ? body.category.trim() : ''
  const category: TemplateCategory = VALID_CATEGORIES.has(categoryRaw)
    ? (categoryRaw as TemplateCategory)
    : TemplateCategory.General

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })
  if (!bodyText) return NextResponse.json({ error: 'body is required' }, { status: 400 })

  const variables = extractVariables(bodyText)

  try {
    const existing = await db.template.findFirst({ where: { name } })
    const template = existing
      ? await db.template.update({
          where: { id: existing.id },
          data: { useCase, body: bodyText, approved: body.approved !== false, category, variables },
        })
      : await db.template.create({
          data: { name, useCase, body: bodyText, approved: body.approved !== false, category, variables },
        })
    return NextResponse.json(template, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Could not create template' }, { status: 503 })
  }
}
