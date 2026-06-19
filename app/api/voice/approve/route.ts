import { NextRequest, NextResponse } from 'next/server'
import { getDb, workItems, actions, activityLogs } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sql } from 'drizzle-orm'
import type { VoiceDraft } from '@/lib/voice/types'

type ApprovePayload = {
  voice_id?: string
  voiceId?: string
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
  const voiceId = body.voice_id || body.voiceId
  const decision = body.action ?? 'approve'

  if (!voiceId) return NextResponse.json({ error: 'voice_id is required' }, { status: 400 })

  try {
    const db = await getDb()

    const result = await db.transaction(async (tx) => {
      const rows = await tx.execute<VoiceRow>(
        sql`SELECT voice_id, transcript, parsed_json, status
            FROM voice_intake
            WHERE voice_id = ${voiceId}
            FOR UPDATE`
      )

      const record = rows[0]
      if (!record) throw new Error('Voice intake record not found')
      if (record.status === 'APPROVED' || record.status === 'REJECTED') {
        throw new Error(`Voice intake already ${record.status.toLowerCase()}`)
      }

      if (decision === 'reject') {
        await tx.execute(
          sql`UPDATE voice_intake
              SET status = 'REJECTED', review_notes = ${body.review_notes ?? null},
                  approved_at = now(), approved_by = ${session.person}
              WHERE voice_id = ${voiceId}`
        )

        return { ok: true, status: 'REJECTED' as const }
      }

      const draft = body.draft ?? record.parsed_json ?? {}
      const dueDate = draft.follow_up_date ? new Date(`${draft.follow_up_date}T12:00:00.000Z`) : null
      const priority = draft.urgency === 'Urgent' ? 'Urgent' : 'Medium'
      const title = buildTitle(draft)

      const [item] = await tx.insert(workItems).values({
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
      }).returning()

      const [followUp] = await tx.insert(actions).values({
        workItemId: item.id,
        actionType: 'CreateFollowUp',
        label: draft.next_action || 'Follow up voice lead',
        assignedTo: session.person,
        dueDate,
      }).returning()

      await tx.insert(activityLogs).values({
        workItemId: item.id,
        actionId: followUp.id,
        person: session.person,
        eventType: 'Created',
        summary: `Voice Intake approved and created work item "${item.title}"`,
        evidenceLink: voiceId,
        newStatus: item.status,
      })

      await tx.execute(
        sql`UPDATE voice_intake
            SET parsed_json = ${JSON.stringify(draft)}::jsonb,
                status = 'APPROVED',
                linked_task_id = ${followUp.id},
                linked_lead_id = ${item.id},
                review_notes = ${body.review_notes ?? null},
                approved_at = now(),
                approved_by = ${session.person}
            WHERE voice_id = ${voiceId}`
      )

      return { ok: true, status: 'APPROVED' as const, workItemId: item.id, actionId: followUp.id }
    })

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Voice approval failed'
    const status = message.includes('not found') ? 404 : message.includes('already') ? 409 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
