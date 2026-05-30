export type VoiceUrgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ClassificationResult {
  urgency: VoiceUrgency;
  humanReviewRequired: boolean;
  reasons: string[];
}

// ─── Pattern tables ───────────────────────────────────────────────────────────

const CRITICAL_PATTERNS: readonly RegExp[] = [
  /\bdissolut/i,
  /\bdissolving\b/i,
  /\bstruck[\s-]*off\b/i,
  /\bwound[\s-]*up\b/i,
  /\bfraud/i,
  /\bhmrc[\s\w]{0,25}enforc/i,
  /\bcompanies\s+house[\s\w]{0,25}enforc/i,
  /\bcourt\s+order\b/i,
  /\bdirector\s+disput/i,
  /\bdirector\s+remov/i,
  /\blegal\s+threat/i,
  /\binsolvenc/i,
  /\bliquidat/i,
  /\badministrat(ion|or)\b/i,
  /\bcompulsory\s+wind/i,
  /\brestoration\s+order/i,
];

const HIGH_PATTERNS: readonly RegExp[] = [
  /\bstrike[\s-]*off\s+warn/i,
  /\bmissing\s+account/i,
  /\bmissing\s+confirmation\s+statement/i,
  /\boverdue\s+(filing|accounts|confirmation)/i,
  /\blate\s+filing\s+penalt/i,
  /\bpenalt(y|ies)\b/i,
  /\benforcement\s+notice/i,
  /\bnotice\s+of\s+striking/i,
  /\bfirst\s+gazette/i,
];

const MEDIUM_PATTERNS: readonly RegExp[] = [
  /\bupcoming\s+filing/i,
  /\bfiling\s+(is\s+)?due/i,
  /\bnot\s+sure\b/i,
  /\bunsure\b/i,
  /\bfollow[\s-]*up\b/i,
  /\bunclear\b/i,
  /\bpending\b/i,
  /\bneed\s+to\s+(check|confirm|verify)\b/i,
  /\bclient\s+hasn'?t\s+responded/i,
  /\bstatus\s+unknown\b/i,
];

// ─── Date extraction ──────────────────────────────────────────────────────────

// Matches DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
const DATE_REGEX = /\b(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/g;

function parseDateString(raw: string): Date | null {
  // YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/.exec(raw);
  if (isoMatch) {
    const d = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    return isNaN(d.getTime()) ? null : d;
  }
  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/.exec(raw);
  if (dmy) {
    const year = dmy[3].length === 2 ? 2000 + Number(dmy[3]) : Number(dmy[3]);
    const d = new Date(year, Number(dmy[2]) - 1, Number(dmy[1]));
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function extractDates(text: string): Date[] {
  const dates: Date[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(DATE_REGEX.source, 'g');
  while ((m = re.exec(text)) !== null) {
    const d = parseDateString(m[0]);
    if (d) dates.push(d);
  }
  return dates;
}

function hasDateWithin7Days(text: string, now: Date): boolean {
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  for (const d of extractDates(text)) {
    const diff = d.getTime() - now.getTime();
    if (diff >= 0 && diff <= sevenDaysMs) return true;
  }
  return false;
}

// ─── Classifier ───────────────────────────────────────────────────────────────

/**
 * Classifies voice intake text into a risk urgency level.
 *
 * Rules are applied in order: CRITICAL → HIGH → MEDIUM → LOW.
 * Pure and deterministic — no external calls, no side effects.
 *
 * @param text        Combined free-text (reason + summary + transcript).
 * @param deadlineDate Optional explicit deadline string (DD/MM/YYYY etc).
 * @param now         Reference time (injectable for testing).
 */
export function classifyVoiceIntake(
  text: string,
  deadlineDate: string | null | undefined,
  now: Date = new Date(),
): ClassificationResult {
  const reasons: string[] = [];

  for (const pattern of CRITICAL_PATTERNS) {
    if (pattern.test(text)) {
      reasons.push(`critical_match:${pattern.source}`);
      return { urgency: 'CRITICAL', humanReviewRequired: true, reasons };
    }
  }

  const highReasons: string[] = [];
  for (const pattern of HIGH_PATTERNS) {
    if (pattern.test(text)) {
      highReasons.push(`high_match:${pattern.source}`);
    }
  }

  // Explicit deadline field checked first; fall back to scanning full text
  const deadlineSource = deadlineDate ? deadlineDate + ' ' + text : text;
  if (hasDateWithin7Days(deadlineSource, now)) {
    highReasons.push('deadline_within_7_days');
  }

  if (highReasons.length > 0) {
    reasons.push(...highReasons);
    return { urgency: 'HIGH', humanReviewRequired: true, reasons };
  }

  for (const pattern of MEDIUM_PATTERNS) {
    if (pattern.test(text)) {
      reasons.push(`medium_match:${pattern.source}`);
      return { urgency: 'MEDIUM', humanReviewRequired: false, reasons };
    }
  }

  reasons.push('no_risk_signals');
  return { urgency: 'LOW', humanReviewRequired: false, reasons };
}
