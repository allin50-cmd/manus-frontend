import { ParsedAction } from './types';

export function routeAction(parsed: ParsedAction): void {
  const mockHandlers: Record<string, (p: ParsedAction) => void> = {
    create_reminder: (p) => console.log(`🔔 Reminder: ${p.title} on ${p.date} at ${p.time}`),
    create_task: (p) => console.log(`📋 Task: ${p.title}`),
    schedule_meeting: (p) => console.log(`📅 Meeting with ${p.participants?.join(', ')} on ${p.date} at ${p.time}`),
    draft_email: (p) => console.log(`✉️ Draft email to ${p.recipient} about ${p.subject}`),
    create_invoice: (p) => console.log(`🧾 Invoice for ${p.client} – ${p.amount}`),
    book_callback: (p) => console.log(`📞 Callback with ${p.contact} on ${p.date} at ${p.time}`),
    unknown: () => console.log('❓ Unknown action'),
  };

  const handler = mockHandlers[parsed.action] || mockHandlers.unknown;
  handler(parsed);
}
