import { SwarmNode } from './types';

export type MissionStatusLevel = 'NOMINAL' | 'DEGRADED' | 'CRITICAL' | 'FAILED';

export interface MissionStatus {
  level: MissionStatusLevel;
  score: number;           // 0–100 composite
  asrpOnline: boolean;
  relaysCoverage: number;  // 0–100
  operationalRatio: number; // 0–100: fraction of non-ASRP nodes that are GREEN or AMBER
  summary: string;
}

export function computeMissionHealth(nodes: SwarmNode[]): MissionStatus {
  const asrp = nodes.find((n) => n.role === 'ASRP');
  const asrpOnline = asrp?.state === 'GREEN' || asrp?.state === 'AMBER' || asrp?.state === 'RECOVER';

  const relays = nodes.filter((n) => n.role === 'AIR_RELAY');
  const healthyRelays = relays.filter((n) => n.state === 'GREEN' || n.state === 'AMBER');
  const relaysCoverage = relays.length > 0
    ? Math.round((healthyRelays.length / relays.length) * 100)
    : 100;

  const opNodes = nodes.filter((n) => n.role !== 'ASRP');
  const opOk = opNodes.filter((n) => n.state === 'GREEN' || n.state === 'AMBER');
  const operationalRatio = opNodes.length > 0
    ? Math.round((opOk.length / opNodes.length) * 100)
    : 100;

  // Composite: ASRP is critical (40 pts), relay coverage 30 pts, ops ratio 30 pts.
  // QUARANTINE nodes are actively compromised (not just absent) and apply an
  // additional 4-pt penalty each so 3+ quarantined nodes push below NOMINAL.
  const asrpScore = asrpOnline ? 100 : 0;
  const quarantineCount = nodes.filter((n) => n.state === 'QUARANTINE').length;
  const quarantinePenalty = quarantineCount * 4;
  const score = Math.max(
    0,
    Math.round(asrpScore * 0.4 + relaysCoverage * 0.3 + operationalRatio * 0.3) - quarantinePenalty,
  );

  let level: MissionStatusLevel;
  if (!asrpOnline) {
    level = 'FAILED';
  } else if (score >= 80) {
    level = 'NOMINAL';
  } else if (score >= 55) {
    level = 'DEGRADED';
  } else {
    level = 'CRITICAL';
  }

  const summary = asrpOnline
    ? `ASRP online · ${healthyRelays.length}/${relays.length} relays · ${opOk.length}/${opNodes.length} ops`
    : 'ASRP OFFLINE — mission continuity at risk';

  return { level, score, asrpOnline, relaysCoverage, operationalRatio, summary };
}
