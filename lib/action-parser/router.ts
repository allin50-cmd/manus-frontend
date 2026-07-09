import type { ParsedAction } from './types'

type Handler = (parsed: ParsedAction) => void

export const actionHandlers: Record<string, Handler> = {
  create_task: (p) => console.log('📋 Task', p),
  schedule_meeting: (p) => console.log('📅 Meeting', p),
  draft_email: (p) => console.log('✉️ Draft email', p),
  create_invoice: (p) => console.log('🧾 Invoice', p),
  book_callback: (p) => console.log('📞 Callback', p),
  unknown: (p) => console.log('❓ Unknown action', p),
}

export function routeParsedAction(parsed: ParsedAction) {
  const handler = actionHandlers[String(parsed.action)] ?? actionHandlers.unknown
  return handler(parsed)
}
