import { classifyAction } from './classifier';
import { extractEntities } from './entityExtractor';
import type { ActionType, ExtractedEntities, ParsedAction } from './types';

const REQUIRED_FIELDS: Record<ActionType, (keyof ExtractedEntities)[]> = {
  create_reminder: ['title', 'date', 'time'],
  create_task: ['title'],
  draft_email: ['person', 'title'],
  create_invoice: ['amount', 'title'],
  book_callback: ['person', 'date', 'time'],
  schedule_meeting: ['participants', 'date', 'time'],
  unknown: [],
};

function calculateConfidence(baseScore: number, missingFields: string[]): number {
  return Math.max(0.1, Number((baseScore - missingFields.length * 0.2).toFixed(2)));
}

function buildAction(action: ActionType, entities: ExtractedEntities, text: string, baseScore: number): ParsedAction {
  const requiredFields = REQUIRED_FIELDS[action];
  const missingFields = requiredFields.filter((field) => entities[field] === undefined) as string[];
  const confidence = action === 'unknown' ? 0.2 : calculateConfidence(baseScore, missingFields);

  return {
    action,
    title: entities.title,
    message: action === 'draft_email' ? entities.title : undefined,
    person: entities.person,
    participants: entities.participants,
    amount: entities.amount,
    currency: entities.currency,
    date: entities.date,
    time: entities.time,
    confidence,
    needs_confirmation: action === 'unknown' || missingFields.length > 0 || confidence < 0.7,
    missing_fields: action === 'unknown' ? ['action'] : missingFields,
    raw_text: text,
  };
}

export function parseActionRequest(text: string, referenceDate = new Date()): ParsedAction {
  const classification = classifyAction(text);
  const entities = extractEntities(text, referenceDate);

  return buildAction(classification.action, entities, text, classification.score);
}
