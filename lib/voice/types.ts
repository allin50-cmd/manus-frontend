export type VoiceIntakeStatus =
  | 'RECORDED'
  | 'UPLOADED'
  | 'TRANSCRIBED'
  | 'PARSED'
  | 'NEEDS_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'FAILED'

export type VoiceDraft = {
  company?: string
  contact_name?: string
  phone?: string
  email?: string
  location?: string
  project_type?: string
  budget?: number
  urgency?: string
  next_action?: string
  follow_up_date?: string
  notes?: string
}

export type VoiceIntakeRecord = {
  voice_id: string
  created_at: string
  created_by: string
  audio_url: string | null
  transcript: string | null
  parsed_json: VoiceDraft | null
  status: VoiceIntakeStatus
  linked_company_id: string | null
  linked_contact_id: string | null
  linked_lead_id: string | null
  linked_task_id: string | null
  review_notes: string | null
  approved_at: string | null
  approved_by: string | null
}
