import type { ConfidenceScores } from './types';

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

// Weights sum to 1.00. Consensus is included because it captures the node's
// ability to coordinate — a node that can't agree with peers is mission-degraded.
export function calcSurvivalScore(c: ConfidenceScores): number {
  return clampScore(
    c.safety        * 0.25 +
    c.comms         * 0.15 +
    c.navigation    * 0.08 +
    c.nav_integrity * 0.12 +
    c.clock_health  * 0.12 +
    c.trust         * 0.13 +
    c.consensus     * 0.10 +
    c.mission       * 0.05,
  );
}

export function survivalGrade(score: number): 'GREEN' | 'AMBER' | 'RED' | 'CRITICAL' {
  if (score >= 80) return 'GREEN';
  if (score >= 60) return 'AMBER';
  if (score >= 40) return 'RED';
  return 'CRITICAL';
}
