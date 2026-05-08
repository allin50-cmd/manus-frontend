import type { ConfidenceScores } from './types';

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calcSurvivalScore(c: ConfidenceScores): number {
  return clampScore(
    c.safety * 0.25 +
    c.comms * 0.15 +
    c.navigation * 0.10 +
    (c.nav_integrity ?? 100) * 0.15 +
    (c.clock_health ?? 100) * 0.15 +
    (c.trust ?? 100) * 0.15 +
    c.mission * 0.05,
  );
}

export function survivalGrade(score: number): 'GREEN' | 'AMBER' | 'RED' | 'CRITICAL' {
  if (score >= 80) return 'GREEN';
  if (score >= 60) return 'AMBER';
  if (score >= 40) return 'RED';
  return 'CRITICAL';
}
