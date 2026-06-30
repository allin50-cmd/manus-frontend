export interface DraftRecord {
  title: string
  type: string
  status?: string
  company?: string
  contactName?: string
  owner?: string
  priority?: string
  nextAction?: string
  dueDate?: string
  notes?: string
}

export interface VoiceDraft {
  id: string
  userId?: string
  transcript?: string
  parsedContent?: Record<string, unknown>
  createdAt: Date
}
