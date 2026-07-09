import { classify } from './classifier';
import { extractEntities } from './entityExtractor';
import { ParsedAction } from './types';

export function parseAction(text: string): ParsedAction {
  const { action, score } = classify(text);
  const entities = extractEntities(text);

  const parsed: ParsedAction = {
    action,
    confidence: score,
    ...entities,
    needs_confirmation: score < 0.6,
  };

  // Count missing fields based on action
  const requiredFields: Record<string, string[]> = {
    create_reminder: ['title', 'date', 'time'],
    create_task: ['title'],
    schedule_meeting: ['date', 'time'],
    draft_email: ['subject', 'recipient'],
    create_invoice: ['client', 'amount'],
    book_callback: ['contact', 'date', 'time'],
    unknown: [],
  };
  const fields = requiredFields[action] || [];
  const missing = fields.filter(f => !parsed[f]);
  parsed.missing_fields = missing;
  parsed.needs_confirmation = missing.length > 0 || parsed.needs_confirmation;

  return parsed;
}
