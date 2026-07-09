import { ParsedAction } from './types';

export function generatePreview(parsed: ParsedAction): string {
  const { action, title, date, time, participants, client, amount, contact, recipient, subject } = parsed;

  switch (action) {
    case 'create_reminder':
      return `🔔 Reminder: "${title}" on ${date || 'a date'} at ${time || 'a time'}.`;
    case 'create_task':
      return `📋 Task: "${title}".`;
    case 'schedule_meeting':
      return `📅 Meeting with ${participants?.join(' & ') || 'someone'} on ${date || 'a date'} at ${time || 'a time'}.`;
    case 'draft_email':
      return `✉️ Draft email to ${recipient || 'someone'} about "${subject || 'a topic'}".`;
    case 'create_invoice':
      return `🧾 Invoice for ${client || 'a client'} – ${amount || 'amount'}.`;
    case 'book_callback':
      return `📞 Callback with ${contact || 'a contact'} on ${date || 'a date'} at ${time || 'a time'}.`;
    default:
      return '❓ Unknown action – please clarify.';
  }
}
