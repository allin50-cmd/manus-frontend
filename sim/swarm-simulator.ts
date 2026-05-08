import { SwarmNode } from "../core/types";
import { UltraEvent } from "../core/event-log";
import { runNodeCycle } from "../core/run-node-cycle";
import { assignSwarmCells, groupCells } from "../core/cell-manager";
import { reconcileRecoveredNode } from "../core/recovery-engine";
import { clampScore } from "../core/confidence-engine";
import { applyPeerVerification } from "../core/peer-verification";
import { generateAlerts, clearAlertHistory, SwarmAlert } from "../core/alert-engine";
import { computeMissionHealth, MissionStatus } from "../core/mission-health";

// ─── override queue ──────────────────────────────────────────
export type OperatorOverride = {
  nodeId: string;
  type: "approveResume" | "forceSafeHold" | "releaseQuarantine";
};
let pendingOverrides: OperatorOverride[] = [];
export function queueOperatorOverrides(overrides: OperatorOverride[]) {
  pendingOverrides = overrides;
}

// ─── blackout tracking ──────────────────────────────────────
const nodeBlackoutStart = new Map<string, number>();

export function trackBlackoutStart(nodes: SwarmNode[]): void {
  for (const node of nodes) {
    if (node.state === "BLACK" && !nodeBlackoutStart.has(node.id)) {
      nodeBlackoutStart.set(node.id, Date.now());
    }
  }
}

// ─── simulation state ──────────────────────────────────────
export function createInitialSwarm(): SwarmNode[] {
  nodeBlackoutStart.clear();
  clearAlertHistory();
  return [
    createNode("ASRP-01",      "ASRP"),
    createNode("AUM-01",       "AUM"),
    createNode("AUM-02",       "AUM"),
    createNode("AUM-03",       "AUM"),
    createNode("AUM-04",       "AUM"),
    createNode("AUM-05",       "AUM"),
    createNode("AIR-RELAY-01", "AIR_RELAY"),
    createNode("AIR-RELAY-02", "AIR_RELAY"),
    createNode("SENSOR-01",    "SENSOR"),
  ];
}

function createNode(id: string, role: SwarmNode["role"]): SwarmNode {
  return {
    id,
    role,
    state: "GREEN",
    cellId: "primary-swarm",
    lastSeenAt: Date.now(),
    confidence: {
      comms: 95,
      navigation: 92,
      mission: 90,
      safety: 96,
      consensus: 94,
      nav_integrity: 100,
      clock_health: 100,
      trust: 100,
    },
    recoveryAttempts: 0,
  };
}

// ─── confidence manipulation ─────────────────────────────────
export function degradeNodeConfidence(node: SwarmNode, tick: number): SwarmNode {
  const confidence = { ...node.confidence };

  // AUM-02: comms/consensus drop at tick 2
  if (node.id === "AUM-02" && tick >= 2) {
    confidence.comms -= 35;
    confidence.consensus -= 40;
  }

  // AUM-03: safety dips ticks 3–5, recovers tick 6+
  if (node.id === "AUM-03") {
    if (tick >= 3 && tick <= 5) {
      confidence.safety -= 45;
    } else if (tick >= 6) {
      confidence.safety = Math.max(confidence.safety, 80);
    }
  }

  // AIR-RELAY-01: comms/consensus boost at tick 4
  if (node.id === "AIR-RELAY-01" && tick >= 4) {
    confidence.comms += 20;
    confidence.consensus += 25;
  }

  // Phase 1 — GNSS spoofing on AUM-04 (starts tick 6)
  if (node.id === "AUM-04" && tick >= 6) {
    confidence.navigation  = Math.max(0, 92 - (tick - 5) * 20);    // 72 → 52 → 32 …
    confidence.nav_integrity = Math.max(0, 100 - (tick - 6) * 25); // 75 → 50 → 25 …
  }

  // Phase 1 — Clock attack on SENSOR-01 (starts tick 7)
  if (node.id === "SENSOR-01" && tick >= 7) {
    confidence.clock_health = Math.max(0, 100 - (tick - 6) * 35);  // 65 → 30 → 0 …
  }

  // Phase 2 — Consensus poisoning on AUM-05 (starts tick 8)
  // Mission confidence rises suspiciously while other AUM peers degrade
  if (node.id === "AUM-05" && tick >= 8) {
    confidence.mission = Math.min(100, 90 + (tick - 7) * 5);       // 95 → 100 → 100 …
    confidence.consensus = Math.min(100, 94 + (tick - 7) * 3);     // 97 → 100 → 100 …
  }

  return {
    ...node,
    confidence: {
      comms:         clampScore(confidence.comms),
      navigation:    clampScore(confidence.navigation),
      mission:       clampScore(confidence.mission),
      safety:        clampScore(confidence.safety),
      consensus:     clampScore(confidence.consensus),
      nav_integrity: clampScore(confidence.nav_integrity ?? 100),
      clock_health:  clampScore(confidence.clock_health ?? 100),
      trust:         clampScore(confidence.trust ?? 100),
    },
  };
}

// ─── relay mesh recovery ─────────────────────────────────────
function applyRelayRecovery(nodes: SwarmNode[], tick: number): SwarmNode[] {
  const activeRelay = nodes.some(
    (n) =>
      n.role === "AIR_RELAY" &&
      n.confidence.comms >= 80 &&
      n.confidence.consensus >= 80
  );
  if (!activeRelay || tick < 4) return nodes;

  return nodes.map((node) => {
    if (node.state !== "BLACK" && node.state !== "AMBER") return node;
    return {
      ...node,
      confidence: {
        ...node.confidence,
        comms:     clampScore(node.confidence.comms + 25),
        consensus: clampScore(node.confidence.consensus + 30),
      },
    };
  });
}

// ─── BLACK → RECOVER transition (with loop-trap detection) ──
function applyBlackToRecover(nodes: SwarmNode[]): SwarmNode[] {
  return nodes.map((node) => {
    if (node.state !== "BLACK") return node;
    if (node.confidence.comms > 50 && node.confidence.consensus >= 30) {
      const attempts = node.recoveryAttempts ?? 0;
      // Recovery loop trap: too many failed cycles → QUARANTINE
      if (attempts >= 3) {
        return {
          ...node,
          state: "QUARANTINE",
          cellId: "quarantine-cell",
          currentTask: "RECOVERY_LOOP_QUARANTINE",
        };
      }
      trackBlackoutStart([node]);
      return {
        ...node,
        state: "RECOVER",
        cellId: "recovery-cell",
        recoveryAttempts: attempts + 1,
      };
    }
    return node;
  });
}

// ─── recovery engine integration ─────────────────────────────
function recoverNodes(nodes: SwarmNode[], eventLog: UltraEvent[]): SwarmNode[] {
  return nodes.map((node) => {
    if (node.state !== "RECOVER") return node;

    const disconnectTime = nodeBlackoutStart.get(node.id);
    const eventsSinceDisconnect = eventLog.filter(
      (e) =>
        e.nodeId === node.id &&
        (disconnectTime ? e.timestamp > disconnectTime : true)
    );

    const result = reconcileRecoveredNode(node, eventsSinceDisconnect);
    if (result.status === "RECOVERED" || result.status === "QUARANTINED") {
      nodeBlackoutStart.delete(node.id);
    }
    return result.node;
  });
}

// ─── operator overrides ──────────────────────────────────────
function applyOperatorOverrides(nodes: SwarmNode[]): SwarmNode[] {
  if (pendingOverrides.length === 0) return nodes;
  const overrideMap = new Map(pendingOverrides.map((o) => [o.nodeId, o]));
  pendingOverrides = [];
  return nodes.map((node) => {
    const ov = overrideMap.get(node.id);
    if (!ov) return node;
    if (ov.type === "approveResume") {
      return { ...node, operatorResumeApproved: true };
    }
    if (ov.type === "forceSafeHold") {
      return {
        ...node,
        confidence: { ...node.confidence, safety: 0 },
        operatorResumeApproved: false,
      };
    }
    if (ov.type === "releaseQuarantine") {
      return { ...node, operatorResumeApproved: true, recoveryAttempts: 0 };
    }
    return node;
  });
}

// ─── main tick ─────────────────────────────────────────────
export type SimulationResult = {
  tick: number;
  nodes: SwarmNode[];
  cells: ReturnType<typeof groupCells>;
  eventLog: UltraEvent[];
  alerts: SwarmAlert[];
  missionHealth: MissionStatus;
};

export function runSimulationTick(input: {
  missionId: string;
  tick: number;
  nodes: SwarmNode[];
  eventLog: UltraEvent[];
}): SimulationResult {
  let eventLog = input.eventLog;

  // 1. scenario degradation
  const degradedNodes = input.nodes.map((n) => degradeNodeConfidence(n, input.tick));

  // 2. relay mesh recovery
  const relayRecoveredNodes = applyRelayRecovery(degradedNodes, input.tick);

  // 3. operator overrides (from dashboard)
  const overriddenNodes = applyOperatorOverrides(relayRecoveredNodes);

  // 4. peer verification — detects consensus poisoning, adjusts trust
  const verifiedNodes = applyPeerVerification(overriddenNodes);

  // 5. BLACK → RECOVER if conditions met
  const preRecoveryNodes = applyBlackToRecover(verifiedNodes);

  // 6. recovery replay for RECOVER nodes
  const postRecoveryNodes = recoverNodes(preRecoveryNodes, eventLog);

  // 7. safety shield loop
  const updatedNodes = postRecoveryNodes.map((node) => {
    const result = runNodeCycle({
      missionId: input.missionId,
      node,
      aiRecommendation: {
        action: "ADVANCE",
        confidence: 82,
      },
      eventLog,
    });
    eventLog = result.eventLog;
    return result.node;
  });

  // 8. track blackout start for any node now in BLACK
  trackBlackoutStart(updatedNodes);

  // 9. cell assignment
  const assignedNodes = assignSwarmCells(updatedNodes);
  const cells = groupCells(assignedNodes);

  // 10. alert generation
  const alerts = generateAlerts(assignedNodes, input.tick);

  // 11. mission health
  const missionHealth = computeMissionHealth(assignedNodes);

  return {
    tick: input.tick,
    nodes: assignedNodes,
    cells,
    eventLog,
    alerts,
    missionHealth,
  };
}
