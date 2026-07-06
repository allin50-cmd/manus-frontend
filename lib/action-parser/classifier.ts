import type { ActionType } from './types';

const KEYWORDS: Record<Exclude<ActionType, 'unknown'>, string[]> = {
  create_reminder: ['remind', 'reminder', 'remember to'],
  create_task: ['task', 'todo', 'to do', 'chase', 'follow up'],
  draft_email: ['draft email', 'email', 'send email', 'write to'],
  create_invoice: ['invoice', 'bill', 'charge'],
  book_callback: ['callback', 'call back', 'phone call', 'book a call'],
  schedule_meeting: ['schedule a meeting', 'set up a meeting', 'arrange a meeting', 'meeting with', 'catch up with', 'sync with'],
};

export function classifyAction(text: string): { action: ActionType; score: number } {
  const normalised = text.toLowerCase().trim();

  if (!normalised) {
    return { action: 'unknown', score: 0.1 };
  }

  let best: { action: ActionType; score: number } = { action: 'unknown', score: 0.2 };

  for (const [action, keywords] of Object.entries(KEYWORDS) as [Exclude<ActionType, 'unknown'>, string[]][]) {
    const matches = keywords.filter((keyword) => normalised.includes(keyword));
    if (matches.length === 0) continue;

    const score = Math.min(1, 0.65 + matches.length * 0.15);
    if (score > best.score) {
      best = { action, score };
    }
  }

  return best;
}
