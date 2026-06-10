import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import type { VoiceDraft } from '@/lib/voice/types'

type ApprovePayload = {
  voice_id?: string
  draft?: VoiceDraft
  action?: 'approve' | 'reject'
  review_notes?: string
}

type VoiceRow = {
  voice_id: string
  transcript: string | null
  parsed_json: VoiceDraft | null
  status: string
}

function buildTitle(draft: VoiceDraft) {
  const person = draft.contact_name || 'Voice lead'
  const project = draft.project_type ? ` - ${draft.project_type}` : ''
  const place = draft.location ? ` (${draft.location})` : ''
  return `${person}${project}${place}`
}

function buildNotes(draft: VoiceDraft, transcript?: string | null) {
  const lines = [
    draft.notes ? `Notes: ${draft.notes}` : null,
    draft.phone ? `Phone: ${draft.phone}` : null,
    draft.email ? `Email: ${draft.email}` : null,
    draft.location ? `Location: ${draft.location}` : null,
    draft.project_type ? `Project type: ${draft.project_type}` : null,
    draft.budget ? `Budget: £${draft.budget.toLocaleString('en-GB')}` : null,
    draft.urgency ? `Urgency: ${draft.urgency}` : null,
    transcript ? `Original transcript: ${transcript}` : null,
  ].filter(Boolean)

  return lines.join('\n')
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as ApprovePayload
  const voiceId = body.voice_id
  const action = body.action ?? 'approve'

  if (!voiceId) return NextResponse.json({ error: 'voice_id is required' }, { status: 400 })

  const rows = await db.$queryRawUnsafe<VoiceRow[]>(
    `SELECT voice_id, transcript, parsed_json, status
     FROM voice_intake
     WHERE voice_id = $1
     LIMIT 1`,
    voiceId,
  )

  const record = rows[0]
  if (!record) return NextResponse.json({ error: 'Voice intake record not found' }, { status: 404 })
  if (record.status === 'APPROVED') return NextResponse.json({ error: 'Voice intake already approved' }, { status: 409 })

  if (action === 'reject') {
    await db.$executeRawUnsafe(
      `UPDATE voice_intake
       SET status = 'REJECTED', review_notes = $2, approved_at = now(), approved_by = $3
       WHERE voice_id = $1`,
      voiceId,
      body.review_notes ?? null,
      session.person,
    )

    return NextResponse.json({ ok: true, status: 'REJECTED' })
  }

  const draft = body.draft ?? record.parsed_json ?? {}
  const dueDate = draft.follow_up_date ? new Date(`${draft.follow_up_date}T12:00:00.000Z`) : null
  const priority = draft.urgency === 'Urgent' ? 'Urgent' : 'Medium'
  const title = buildTitle(draft)

  const item = await db.workItem.create({
    data: {
      type: 'ConstructionLead',
      title,
      company: draft.company || draft.location || null,
      contactName: draft.contact_name || null,
      owner: session.person,
      status: 'Captured',
      priority,
      nextAction: draft.next_action || 'Review lead',
      dueDate,
      notes: buildNotes(draft, record.transcript),
    },
  })

  const followUp = await db.action.create({
    data: {
      workItemId: item.id,
      actionType: 'CreateFollowUp',
      label: draft.next_action || 'Follow up voice lead',
      assignedTo: session.person,
      dueDate,
    },
  })

  await db.activityLog.create({
    data: {
      workItemId: item.id,
      actionId: followUp.id,
      person: session.person,
      eventType: 'Created',
      summary: `Voice Intake approved and created work item "${item.title}"`,
      evidenceLink: voiceId,
      newStatus: item.status,
    },
  })

  await db.$executeRawUnsafe(
    `UPDATE voice_intake
     SET parsed_json = $2::jsonb,
         status = 'APPROVED',
         linked_task_id = $3,
         linked_lead_id = $4,
         review_notes = $5,
         approved_at = now(),
         approved_by = $6
     WHERE voice_id = $1`,
    voiceId,
    JSON.stringify(draft),
    followUp.id,
    item.id,
    body.review_notes ?? null,
    session.person,
  )

  return NextResponse.json({ ok: true, status: 'APPROVED', workItemId: item.id, actionId: followUp.id })
}
