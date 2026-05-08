import { SwarmNode } from './types';
import { clampScore } from './confidence-engine';

export interface PeerVerificationResult {
  nodeId: string;
  suspicionScore: number;  // 0–100; high = likely consensus poisoning
  reason: string;
}

// swarmNodes is the full active (non-BLACK, non-QUARANTINE) node list.
// Using the whole swarm (not just cell-mates) is intentional: ASRP and relays
// act as trust anchors across all cells.
export function detectConsensusPoisoning(
  node: SwarmNode,
  swarmNodes: SwarmNode[],
): PeerVerificationResult {
  const peers = swarmNodes.filter((n) => n.id !== node.id && n.state !== 'BLACK' && n.state !== 'QUARANTINE');
  if (peers.length < 2) {
    return { nodeId: node.id, suspicionScore: 0, reason: 'Insufficient peers for comparison' };
  }

  const avgPeerMission = peers.reduce((s, p) => s + p.confidence.mission, 0) / peers.length;
  const avgPeerConsensus = peers.reduce((s, p) => s + p.confidence.consensus, 0) / peers.length;

  // Suspicious if node's mission confidence is abnormally high while peers degrade
  const missionDeviation = node.confidence.mission - avgPeerMission;
  const consensusDeviation = node.confidence.consensus - avgPeerConsensus;

  // Poisoning signature: mission rising while peers fall + consensus diverging
  const peersDegraded = avgPeerMission < 78 || avgPeerConsensus < 78;
  const nodeAnomalouslyHigh = missionDeviation > 12 && node.confidence.mission > 82;

  if (peersDegraded && nodeAnomalouslyHigh) {
    const suspicion = clampScore(50 + missionDeviation * 1.5 + Math.abs(consensusDeviation));
    return {
      nodeId: node.id,
      suspicionScore: suspicion,
      reason: `Mission confidence ${node.confidence.mission} vs peer avg ${avgPeerMission.toFixed(0)} — anomalous divergence detected`,
    };
  }

  return { nodeId: node.id, suspicionScore: 0, reason: 'Nominal peer agreement' };
}

export function applyPeerVerification(nodes: SwarmNode[]): SwarmNode[] {
  const activeNodes = nodes.filter((n) => n.state !== 'BLACK' && n.state !== 'QUARANTINE');

  return nodes.map((node) => {
    if (node.state === 'BLACK' || node.state === 'QUARANTINE') return node;

    const result = detectConsensusPoisoning(node, activeNodes);
    if (result.suspicionScore < 50) return node;

    // High suspicion: degrade trust score
    const penalty = Math.floor(result.suspicionScore * 0.5);
    return {
      ...node,
      confidence: {
        ...node.confidence,
        trust: clampScore(node.confidence.trust - penalty),
      },
    };
  });
}
