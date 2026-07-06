import type { ExtractedEntities } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function nextWeekday(referenceDate: Date, targetDay: number): Date {
  const date = new Date(referenceDate);
  const currentDay = date.getDay();
  let daysAhead = targetDay - currentDay;
  if (daysAhead <= 0) daysAhead += 7;
  date.setDate(date.getDate() + daysAhead);
  return date;
}

function extractDate(text: string, referenceDate: Date): string | undefined {
  const lower = text.toLowerCase();

  if (lower.includes('tomorrow')) {
    return toIsoDate(new Date(referenceDate.getTime() + DAY_MS));
  }

  if (lower.includes('today')) {
    return toIsoDate(referenceDate);
  }

  const nextMatch = lower.match(/next\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/);
  if (nextMatch) {
    return toIsoDate(nextWeekday(referenceDate, WEEKDAY_INDEX[nextMatch[1]]));
  }

  const isoMatch = lower.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (isoMatch) {
    return isoMatch[1];
  }

  return undefined;
}

function extractTime(text: string): string | undefined {
  const lower = text.toLowerCase();
  const match = lower.match(/\b(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
  if (!match) return undefined;

  let hour = Number(match[1]);
  const minute = match[2] ? Number(match[2]) : 0;
  const meridiem = match[3];

  if (meridiem === 'pm' && hour < 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;

  if (hour > 23 || minute > 59) return undefined;

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function extractMoney(text: string): { amount?: number; currency?: 'GBP' | 'USD' | 'EUR' } {
  const match = text.match(/(?:£|\$|€|GBP|USD|EUR)\s?([\d,]+(?:\.\d{1,2})?)/i);
  if (!match) return {};

  const marker = match[0].trim().slice(0, 3).toUpperCase();
  const amount = Number(match[1].replace(/,/g, ''));
  const currency = marker.includes('£') || marker.includes('GBP') ? 'GBP' : marker.includes('€') || marker.includes('EUR') ? 'EUR' : 'USD';

  return Number.isFinite(amount) ? { amount, currency } : {};
}

function extractPerson(text: string): string | undefined {
  const match = text.match(/\b(?:to|with|for|call|email)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
  return match?.[1];
}

function cleanTitle(text: string): string | undefined {
  const cleaned = text
    .replace(/\b(remind me|create a task|add a task|draft an email|send an email|create an invoice|book a callback|book a call)\b/gi, '')
    .replace(/\b(today|tomorrow|next\s+(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday))\b/gi, '')
    .replace(/\bat\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/gi, '')
    .replace(/(?:£|\$|€|GBP|USD|EUR)\s?[\d,]+(?:\.\d{1,2})?/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/^\s*(to|for|with|about)\s+/i, '')
    .trim();

  if (!cleaned) return undefined;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function extractEntities(text: string, referenceDate = new Date()): ExtractedEntities {
  const money = extractMoney(text);

  return {
    title: cleanTitle(text),
    person: extractPerson(text),
    date: extractDate(text, referenceDate),
    time: extractTime(text),
    ...money,
  };
}
