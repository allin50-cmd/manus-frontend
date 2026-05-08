/**
 * Lunar Legal Triage Engine
 *
 * Pure deterministic function — no IO, no side effects.
 * Scores a client's description and returns a risk profile.
 * AI layer sits on top of this; it never replaces it.
 */

export interface TriageResult {
  riskScore: number;           // 0–100
  urgency: 'normal' | 'high' | 'critical';
  flags: string[];             // keywords that contributed to the score
  scoreBreakdown: { signal: string; weight: number }[];
}

// Each signal adds weight to the base score of 20
const SIGNALS: [string, number][] = [
  // Court & legal process
  ['court',           25],
  ['tribunal',        25],
  ['injunction',      30],
  ['hearing',         20],
  ['judgment',        20],

  // Time pressure
  ['deadline',        20],
  ['urgent',          15],
  ['today',           10],
  ['tomorrow',        10],
  ['expire',          20],

  // High-stakes situations
  ['eviction',        30],
  ['repossession',    30],
  ['arrest',          40],
  ['criminal',        40],
  ['custody',         30],
  ['restraining',     35],

  // Serious offences
  ['fraud',           35],
  ['threat',          25],
  ['violence',        35],
  ['harassment',      25],
  ['discrimination',  25],
  ['abuse',           30],

  // Financial
  ['bankruptcy',      20],
  ['insolvency',      20],
  ['debt',            15],
  ['repayment',       10],

  // Civil
  ['divorce',         15],
  ['employment',      10],
  ['contract',        10],
  ['dispute',         10],
  ['damages',         15],
];

export function lunarTriage(description: string): TriageResult {
  const lower = description.toLowerCase();
  const scoreBreakdown: { signal: string; weight: number }[] = [];
  const flags: string[] = [];
  let score = 20;

  for (const [keyword, weight] of SIGNALS) {
    if (lower.includes(keyword)) {
      score += weight;
      flags.push(keyword);
      scoreBreakdown.push({ signal: keyword, weight });
    }
  }

  const riskScore = Math.min(score, 100);
  const urgency: TriageResult['urgency'] =
    riskScore >= 80 ? 'critical' : riskScore >= 50 ? 'high' : 'normal';

  return { riskScore, urgency, flags, scoreBreakdown };
}
