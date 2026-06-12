/**
 * Google Sheets → UltraCore SheetOps webhook.
 *
 * Call this from a Google Apps Script bound to your sheet:
 *
 *   function onSubmit() {
 *     const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('WorkItems');
 *     const rows  = sheet.getDataRange().getValues().slice(1); // skip header
 *     const items = rows.map(([title, company, owner, type, priority, dueDate, notes]) => ({
 *       title, company, owner, type, priority,
 *       dueDate: dueDate ? new Date(dueDate).toISOString() : null,
 *       notes,
 *     }));
 *     UrlFetchApp.fetch('https://<your-domain>/api/sheets-webhook', {
 *       method: 'post',
 *       contentType: 'application/json',
 *       headers: { Authorization: 'Bearer ' + PropertiesService.getScriptProperties().getProperty('SHEETS_WEBHOOK_SECRET') },
 *       payload: JSON.stringify({ rows: items }),
 *     });
 *   }
 *
 * Required env var: SHEETS_WEBHOOK_SECRET — set in Vercel and in Apps Script properties.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isValidType, isValidPriority } from '@/lib/work-item-enums'
import { WorkItemType, Priority } from '@prisma/client'

const VALID_STATUSES_DEFAULT = 'Captured' as const

export async function POST(req: NextRequest) {
  const secret = process.env.SHEETS_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }

  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  let body: { rows?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!Array.isArray(body.rows) || body.rows.length === 0) {
    return NextResponse.json({ error: 'rows must be a non-empty array' }, { status: 400 })
  }

  if (body.rows.length > 500) {
    return NextResponse.json({ error: 'Too many rows (max 500 per request)' }, { status: 400 })
  }

  const created: string[] = []
  const errors: { row: number; error: string }[] = []

  for (let i = 0; i < body.rows.length; i++) {
    const row = body.rows[i] as Record<string, unknown>

    const title = typeof row.title === 'string' ? row.title.trim() : ''
    const owner = typeof row.owner === 'string' ? row.owner.trim() : ''

    if (!title) { errors.push({ row: i, error: 'title is required' }); continue }
    if (!owner) { errors.push({ row: i, error: 'owner is required' }); continue }

    const type = isValidType(row.type) ? (row.type as WorkItemType) : 'Other'
    const priority = isValidPriority(row.priority) ? (row.priority as Priority) : 'Medium'

    let dueDate: Date | null = null
    if (row.dueDate) {
      const d = new Date(row.dueDate as string)
      if (!Number.isNaN(d.getTime())) dueDate = d
    }

    try {
      const item = await db.workItem.create({
        data: {
          title,
          owner,
          type,
          priority,
          dueDate,
          company: typeof row.company === 'string' ? row.company.trim() || null : null,
          notes: typeof row.notes === 'string' ? row.notes.trim() || null : null,
          status: VALID_STATUSES_DEFAULT,
        },
      })
      created.push(item.id)
    } catch {
      errors.push({ row: i, error: 'Database error — row not saved' })
    }
  }

  return NextResponse.json(
    { created: created.length, errors },
    { status: errors.length > 0 && created.length === 0 ? 422 : 201 },
  )
}
