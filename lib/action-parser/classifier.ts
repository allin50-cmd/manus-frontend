import { ParsedAction } from './types';

const actionKeywords: Record<string, string[]> = {
  create_reminder: ['remind', 'reminder', 'remember'],
  create_task: ['task', 'todo', 'add task'],
  schedule_meeting: ['meeting', 'schedule', 'arrange', 'sync'],
  draft_email: ['email', 'mail', 'draft'],
  create_invoice: ['invoice', 'bill'],
  book_callback: ['callback', 'call back', 'phone'],
};

export function classify(text: string): { action: string; score: number } {
  const lower = text.toLowerCase();
  let bestAction = 'unknown';
  let bestScore = 0;

  for (const [action, keywords] of Object.entries(actionKeywords)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestAction = action;
    }
  }

  // Boost confidence if multiple keywords match
  const confidence = Math.min(bestScore / 2, 0.95);
  return { action: bestAction, score: confidence };
}
