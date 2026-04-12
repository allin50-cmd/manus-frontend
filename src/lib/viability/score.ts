import type { Company } from '@/types/company';
import type { Officer, PersonWithSignificantControl, Charge, ViabilityScore, ViabilityTier } from '@/types/discovery';

interface ViabilityInput {
  company: Company;
  sicCodes: string[];
  hasInsolvencyHistory: boolean;
  hasBeenLiquidated: boolean;
  officers: Officer[];
  personsWithSignificantControl: PersonWithSignificantControl[];
  charges: Charge[];
}

function ageInYears(incorporationDate: string): number {
  if (!incorporationDate) return 0;
  const ms = Date.now() - new Date(incorporationDate).getTime();
  return ms / (1000 * 60 * 60 * 24 * 365.25);
}

function tierFromScore(score: number): ViabilityTier {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'strong';
  if (score >= 50) return 'moderate';
  if (score >= 30) return 'weak';
  return 'poor';
}

/**
 * Pure scoring function — derives a ViabilityScore from live CH data.
 *
 * Max 100 points across five dimensions:
 *   compliance     (0-30)
 *   company age    (0-20)
 *   transparency   (0-20) — known PSC, active officers
 *   debt burden    (0-20) — outstanding charges
 *   stability      (0-10) — no insolvency, active status
 */
export function computeViabilityScore(input: ViabilityInput): ViabilityScore {
  const factors: string[] = [];
  let score = 0;

  // ── 1. Compliance (0-30) ──────────────────────────────────────────────────
  const { compliance } = input.company;
  if (compliance.status === 'compliant') {
    score += 30;
    factors.push('Fully compliant with filing obligations');
  } else if (compliance.status === 'warning') {
    score += 15;
    factors.push('Upcoming filing deadlines require attention');
  } else {
    score += 0;
    factors.push(`${compliance.overdueFilings.length} overdue filing(s) — active penalty risk`);
  }

  // ── 2. Company age (0-20) ─────────────────────────────────────────────────
  const years = ageInYears(input.company.incorporationDate);
  if (years >= 5) {
    score += 20;
    factors.push(`Established business (${Math.floor(years)} years trading)`);
  } else if (years >= 3) {
    score += 14;
    factors.push(`Maturing business (${Math.floor(years)} years trading)`);
  } else if (years >= 1) {
    score += 8;
    factors.push(`Early-stage company (${Math.floor(years)} year${years >= 2 ? 's' : ''} old)`);
  } else {
    score += 3;
    factors.push('Newly incorporated — limited trading history');
  }

  // ── 3. Transparency (0-20) ────────────────────────────────────────────────
  const activePSC = input.personsWithSignificantControl.filter((p) => !p.ceasedOn);
  const activeOfficers = input.officers.filter((o) => !o.resignedOn);

  if (activePSC.length > 0) {
    score += 12;
    factors.push(`${activePSC.length} known beneficial owner(s) registered`);
  } else {
    factors.push('No PSC on record — beneficial ownership unclear');
  }

  if (activeOfficers.length > 0) {
    score += 8;
    factors.push(`${activeOfficers.length} active officer(s) on record`);
  } else {
    factors.push('No active officers found — verify company governance');
  }

  // ── 4. Debt burden (0-20) ─────────────────────────────────────────────────
  const outstandingCharges = input.charges.filter(
    (c) => c.status === 'outstanding' || c.status === 'registered',
  );

  if (outstandingCharges.length === 0) {
    score += 20;
    factors.push('No outstanding charges registered');
  } else if (outstandingCharges.length <= 2) {
    score += 12;
    factors.push(`${outstandingCharges.length} outstanding charge(s) — standard debt position`);
  } else {
    score += 4;
    factors.push(`${outstandingCharges.length} outstanding charges — elevated debt burden`);
  }

  // ── 5. Stability (0-10) ───────────────────────────────────────────────────
  if (input.hasInsolvencyHistory || input.hasBeenLiquidated) {
    score = Math.max(0, score - 20);
    factors.push('Insolvency or liquidation history on record');
  } else if (input.company.status === 'active') {
    score += 10;
    factors.push('Company status: active');
  } else {
    factors.push(`Company status: ${input.company.status} — not actively trading`);
  }

  const clamped = Math.min(100, Math.max(0, score));
  return { score: clamped, tier: tierFromScore(clamped), factors };
}
