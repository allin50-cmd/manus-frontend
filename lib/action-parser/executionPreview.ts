import type { ParsedAction } from './types';

function joinPeople(people?: string[]): string {
  if (!people || people.length === 0) return 'the selected people';
  if (people.length === 1) return people[0];
  return `${people.slice(0, -1).join(', ')} and ${people[people.length - 1]}`;
}

function formatDateTime(action: ParsedAction): string {
  const date = action.date || 'a date to be confirmed';
  const time = action.time || 'a time to be confirmed';
  return `${date} at ${time}`;
}

export function getExecutionPreview(action: ParsedAction | null): string {
  if (!action) return 'Parse a command to see what UltraTech OS would do next.';

  if (action.action === 'unknown') {
    return 'UltraTech OS does not recognise this as a supported action yet.';
  }

  if (action.needs_confirmation) {
    const missing = action.missing_fields.length ? action.missing_fields.join(', ') : 'more information';
    return `This command needs confirmation before execution. Missing: ${missing}.`;
  }

  switch (action.action) {
    case 'create_reminder':
      return `This will create a reminder for ${formatDateTime(action)} titled "${action.title || 'Untitled reminder'}".`;
    case 'create_task':
      return `This will create a task titled "${action.title || 'Untitled task'}".`;
    case 'draft_email':
      return `This will draft an email to ${action.person || 'the selected recipient'} about "${action.message || action.title || 'your message'}".`;
    case 'create_invoice':
      return `This will prepare an invoice for ${action.currency || ''} ${action.amount ?? 'an amount to be confirmed'} titled "${action.title || 'Untitled invoice'}".`;
    case 'book_callback':
      return `This will book a callback with ${action.person || 'the selected person'} for ${formatDateTime(action)}.`;
    case 'schedule_meeting':
      return `This will schedule a meeting with ${joinPeople(action.participants)} for ${formatDateTime(action)} about "${action.title || 'Meeting'}".`;
    default:
      return 'This action is not supported by the execution preview yet.';
  }
}
