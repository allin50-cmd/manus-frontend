/**
 * Lunar Legal Triage Engine
 *
 * Pure deterministic function — no IO, no side effects.
 * Scores a client's description and returns a risk profile.
 * AI layer sits on top of this; it never replaces it.
 */

export interface MatchedTerm {
  term: string;
  sentence: string;
}

export interface TriageResult {
  riskScore: number;           // 0–100
  urgency: 'normal' | 'high' | 'critical';
  flags: string[];             // keywords that contributed to the score
  scoreBreakdown: { signal: string; weight: number }[];
  matchedTerms: MatchedTerm[];  // exact word + sentence context for each match
  sentenceCount: number;        // number of sentences detected
  avgWordsPerSentence: number;  // simple NLP heuristic
  complexityScore: number;      // 0-100: based on sentence length + legal term density
}

// Each signal adds weight to the base score of 20
const SIGNALS: [string, number][] = [
  // Court & legal proceedings
  ['court',           25],
  ['tribunal',        25],
  ['injunction',      30],
  ['hearing',         20],
  ['judgment',        20],
  ['magistrate',      22],
  ['barrister',       20],
  ['solicitor',       20],
  ['litigation',      25],
  ['proceedings',     22],
  ['claimant',        20],
  ['defendant',       20],
  ['appeal',          22],
  ['ruling',          20],
  ['verdict',         22],
  ['contempt',        28],
  ['subpoena',        28],
  ['deposition',      22],
  ['affidavit',       22],
  ['summons',         25],

  // Time pressure / urgency
  ['urgent',          15],
  ['deadline',        20],
  ['today',           10],
  ['tomorrow',        10],
  ['expire',          20],
  ['immediate',       18],
  ['emergency',       20],
  ['imminent',        18],
  ['time-sensitive',  18],
  ['overdue',         15],
  ['final notice',    20],

  // Housing & property
  ['eviction',        30],
  ['repossession',    30],
  ['landlord',        25],
  ['tenancy',         25],
  ['possession',      25],
  ['section 21',      35],
  ['section 8',       35],
  ['mortgage',        20],
  ['foreclosure',     30],
  ['lease',           15],

  // Criminal
  ['arrest',          35],
  ['criminal',        35],
  ['custody',         30],
  ['restraining',     35],
  ['bail',            30],
  ['charge',          25],
  ['prosecution',     30],
  ['conviction',      30],
  ['parole',          25],
  ['probation',       25],
  ['caution',         20],
  ['police',          20],
  ['detained',        30],
  ['remand',          30],

  // Violence & threats
  ['fraud',           35],
  ['threat',          25],
  ['violence',        35],
  ['harassment',      25],
  ['discrimination',  25],
  ['abuse',           30],
  ['assault',         35],
  ['stalking',        30],
  ['coercion',        28],
  ['intimidation',    28],
  ['domestic',        25],

  // Financial
  ['bankruptcy',      20],
  ['insolvency',      20],
  ['debt',            15],
  ['winding up',      22],
  ['administration',  18],
  ['liquidation',     22],
  ['creditor',        18],
  ['receiver',        18],
  ['ccj',             20],
  ['county court judgment', 22],
  ['repayment',       10],

  // Family & employment / civil
  ['divorce',         15],
  ['custody',         30],
  ['matrimonial',     15],
  ['employment',      10],
  ['redundancy',      12],
  ['unfair dismissal',15],
  ['contract',        10],
  ['dispute',         10],
  ['damages',         15],
  ['settlement',      12],
  ['compensation',    12],
];

/**
 * Split text into sentences using punctuation heuristics.
 */
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

export function lunarTriage(description: string): TriageResult {
  const lower = description.toLowerCase();
  const sentences = splitSentences(description);
  const sentenceCount = sentences.length || 1;

  // avg words per sentence
  const totalWords = description.trim().split(/\s+/).filter(w => w.length > 0).length;
  const avgWordsPerSentence = Math.round((totalWords / sentenceCount) * 10) / 10;

  const scoreBreakdown: { signal: string; weight: number }[] = [];
  const flags: string[] = [];
  const matchedTerms: MatchedTerm[] = [];
  let score = 20;

  for (const [keyword, weight] of SIGNALS) {
    if (lower.includes(keyword)) {
      score += weight;
      flags.push(keyword);
      scoreBreakdown.push({ signal: keyword, weight });

      // Record which sentence contains this term
      const matchingSentence = sentences.find(s =>
        s.toLowerCase().includes(keyword),
      ) ?? sentences[0] ?? description;

      matchedTerms.push({ term: keyword, sentence: matchingSentence.trim() });
    }
  }

  const riskScore = Math.min(score, 100);
  const urgency: TriageResult['urgency'] =
    riskScore >= 80 ? 'critical' : riskScore >= 50 ? 'high' : 'normal';

  // Complexity: weighted blend of avg sentence length and legal term density
  const legalTermDensity = totalWords > 0 ? (flags.length / totalWords) * 100 : 0;
  const sentenceLengthFactor = Math.min(avgWordsPerSentence / 40, 1) * 50; // 40 words → max 50pts
  const densityFactor = Math.min(legalTermDensity * 5, 50);                // up to 50pts
  const complexityScore = Math.round(Math.min(sentenceLengthFactor + densityFactor, 100));

  return {
    riskScore,
    urgency,
    flags,
    scoreBreakdown,
    matchedTerms,
    sentenceCount,
    avgWordsPerSentence,
    complexityScore,
  };
}
