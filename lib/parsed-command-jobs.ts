export interface ParsedCommandJob {
  id: string
  title: string
  description: string
  action: string
  status: 'due' | 'active' | 'completed'
  sourceWorkspace: 'command-parser'
  sourceEventType: string
  originalText: string
  createdAt: string
  payload: Record<string, unknown>
}

export const PARSED_COMMAND_JOBS_STORAGE_KEY = 'ultratech:parsed-command-jobs'

export function mapActionToEvent(action: string): string {
  const events: Record<string, string> = {
    create_reminder: 'ReminderCreated',
    create_task: 'TaskCreated',
    schedule_meeting: 'MeetingScheduled',
    create_invoice: 'InvoiceCreated',
    book_callback: 'CallbackBooked',
  }
  return events[action] ?? 'CommandParsed'
}

function getString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function getNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function buildParsedCommandJob(parsedInput: unknown, originalText: string): ParsedCommandJob | null {
  const payload = parsedInput && typeof parsedInput === 'object' ? parsedInput as Record<string, unknown> : {}
  const action = getString(payload.action)

  if (!action || action === 'unknown' || payload.needs_confirmation === true) return null

  const title = getString(payload.title) || getString(payload.message) || originalText
  const person = getString(payload.person) || getString(payload.recipient)
  const date = getString(payload.date)
  const time = getString(payload.time)
  const amount = getNumber(payload.amount)
  const currency = getString(payload.currency) || 'GBP'

  let description = title
  if (action === 'create_reminder') description = 'Reminder: ' + title
  if (action === 'create_task') description = 'Task: ' + title
  if (action === 'schedule_meeting') description = 'Meeting: ' + title + (person ? ' with ' + person : '') + (date ? ' on ' + date : '') + (time ? ' at ' + time : '')
  if (action === 'book_callback') description = 'Callback: ' + title + (person ? ' with ' + person : '')
  if (action === 'create_invoice') description = 'Invoice: ' + title + (amount !== null ? ' for ' + currency + ' ' + amount : '')

  return {
    id: 'cmd-' + Date.now(),
    title,
    description,
    action,
    status: 'due',
    sourceWorkspace: 'command-parser',
    sourceEventType: mapActionToEvent(action),
    originalText,
    createdAt: new Date().toISOString(),
    payload,
  }
}

export function readParsedCommandJobs(): ParsedCommandJob[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(PARSED_COMMAND_JOBS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeParsedCommandJobs(jobs: ParsedCommandJob[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(PARSED_COMMAND_JOBS_STORAGE_KEY, JSON.stringify(jobs))
}

export function queueParsedCommandJob(job: ParsedCommandJob) {
  writeParsedCommandJobs([job, ...readParsedCommandJobs()].slice(0, 50))
}
