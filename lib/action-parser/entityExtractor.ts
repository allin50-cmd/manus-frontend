import { EntityExtraction } from './types';

const dateRegex = /\b(tomorrow|today|next\s+\w+|\d{1,2}\s+\w+\s+\d{4}|\d{4}-\d{2}-\d{2})\b/i;
const timeRegex = /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)|at\s+\d{1,2})\b/i;
const participantRegex = /(?:with|and)\s+([A-Z][a-z]+(?:\s+and\s+[A-Z][a-z]+)?)/;

export function extractEntities(text: string): EntityExtraction {
  const lower = text;
  let date: string | undefined;
  let time: string | undefined;
  let participants: string[] | undefined;

  const dateMatch = lower.match(dateRegex);
  if (dateMatch) date = dateMatch[0];

  const timeMatch = lower.match(timeRegex);
  if (timeMatch) time = timeMatch[0];

  const participantMatch = lower.match(participantRegex);
  if (participantMatch) {
    participants = participantMatch[1].split(/\s+and\s+/);
  }

  // Title extraction: after "about", "regarding", etc.
  let title: string | undefined;
  const titleRegex = /(?:about|regarding|for)\s+(.+)$/i;
  const titleMatch = lower.match(titleRegex);
  if (titleMatch) title = titleMatch[1].trim();

  return { date, time, participants, title };
}
