import { ParsedAction } from './types';

export function validateAction(parsed: ParsedAction): {
  valid: boolean;
  missing: string[];
  needsConfirmation: boolean;
} {
  const requiredFields: Record<string, string[]> = {
    create_reminder: ['title', 'date', 'time'],
    create_task: ['title'],
    schedule_meeting: ['date', 'time'],
    draft_email: ['subject', 'recipient'],
    create_invoice: ['client', 'amount'],
    book_callback: ['contact', 'date', 'time'],
    unknown: [],
  };

  const fields = requiredFields[parsed.action] || [];
  const missing = fields.filter(f => !parsed[f]);
  const needsConfirmation = parsed.needs_confirmation || missing.length > 0;

  return { valid: missing.length === 0 && !needsConfirmation, missing, needsConfirmation };
}
