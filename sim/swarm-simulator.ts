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
// All degradation uses absolute tick-based formulas (not relative to current
// node state) so scenarios are deterministic regardless of recovery history.
export function degradeNodeConfidence(node: SwarmNode, tick: number): SwarmNode {
  const confidence = { ...node.confidence };

  // AUM-02: comms/consensus failure bounded to ticks 2-3.
  // Relay mesh recovery (tick 4+) then naturally restores connectivity.
  if (node.id === "AUM-02" && tick >= 2 && tick <= 3) {
    confidence.comms     = clampScore(95 - (tick - 1) * 35); // t2:60, t3:25
    confidence.consensus = clampScore(94 - (tick - 1) * 40); // t2:54, t3:14
  }

  // AUM-03: safety dip ticks 3-5, full reset at tick 6+.
  // Auto-supervisor clears the RED lock when safety returns to 80.
  if (node.id === "AUM-03") {
    if (tick >= 3 && tick <= 5) {
      confidence.safety = clampScore(96 - (tick - 2) * 45); // t3:51, t4:6, t5:0
    } else if (tick >= 6) {
      confidence.safety = 80;
    }
  }

  // AIR-RELAY-01: mesh relay boost (tick 4+)
  if (node.id === "AIR-RELAY-01" && tick >= 4) {
    confidence.comms     = clampScore(confidence.comms + 20);
    confidence.consensus = clampScore(confidence.consensus + 25);
  }

  // Phase 1 — GNSS spoofing on AUM-04 (ticks 6-15), hardware recovery (tick 16+).
  // nav_integrity < 20 at tick 10 triggers QUARANTINE (confirmed spoofing rule).
  if (node.id === "AUM-04") {
    if (tick >= 6 && tick <= 15) {
      confidence.navigation    = clampScore(92  - (tick - 5) * 20); // 72→52→32→12→0
      confidence.nav_integrity = clampScore(100 - (tick - 6) * 25); // 75→50→25→0
    } else if (tick >= 16) {
      confidence.navigation    = clampScore((tick - 15) * 15);      // 15→30→45→60→75→90
      confidence.nav_integrity = clampScore((tick - 15) * 20);      // 20→40→60→80→100
    }
  }

  // Phase 1 — Clock attack on SENSOR-01 (ticks 7-14), signal recovery (tick 15+).
  // clock_health < 40 at tick 8 triggers BLACK → recovery loop → QUARANTINE.
  if (node.id === "SENSOR-01") {
    if (tick >= 7 && tick <= 14) {
      confidence.clock_health = clampScore(100 - (tick - 6) * 35); // 65→30→0
    } else if (tick >= 15) {
      confidence.clock_health = clampScore((tick - 14) * 25);      // 25→50→75→100
    }
  }

  // Phase 2 — Consensus poisoning on AUM-05 (tick 8+).
  // Mission/consensus rise anomalously. ASRP detects and degrades trust (tick 9+).
  if (node.id === "AUM-05") {
    if (tick >= 8) {
      confidence.mission   = 100;
      confidence.consensus = 100;
    }
    if (tick >= 9) {
      confidence.trust = clampScore(100 - (tick - 8) * 20); // 80→60→40→20→0
    }
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

// ─── auto-supervisor watchdog ────────────────────────────────
// Simulates a background supervisory process that clears stale locks.
// RED with restored safety → auto-approve resume.
// QUARANTINE from nav/trust attack (recoveryAttempts=0) with all scores clear → release.
// Recovery loop traps (recoveryAttempts ≥ 1) require human operator review.
function applyAutoSupervisor(nodes: SwarmNode[]): SwarmNode[] {
  return nodes.map((node) => {
    if (node.state === "RED" && !node.operatorResumeApproved && node.confidence.safety >= 75) {
      return { ...node, operatorResumeApproved: true };
    }
    if (
      node.state === "QUARANTINE" &&
      !node.operatorResumeApproved &&
      (node.recoveryAttempts ?? 0) === 0 &&
      node.confidence.safety                >= 65 &&
      (node.confidence.nav_integrity ?? 100) >= 65 &&
      (node.confidence.clock_health  ?? 100) >= 65 &&
      (node.confidence.trust         ?? 100) >= 65 &&
      node.confidence.comms                 >= 65 &&
      node.confidence.consensus             >= 65
    ) {
      return { ...node, operatorResumeApproved: true, recoveryAttempts: 0 };
    }
    return node;
  });
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
        (disconnectTime ? e.timestamp >= disconnectTime : true)
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

  // 4. auto-supervisor (clears stale RED/QUARANTINE locks when scores recover)
  const supervisedNodes = applyAutoSupervisor(overriddenNodes);

  // 5. peer verification — detects consensus poisoning, adjusts trust
  const verifiedNodes = applyPeerVerification(supervisedNodes);

  // 6. BLACK → RECOVER if conditions met
  const preRecoveryNodes = applyBlackToRecover(verifiedNodes);

  // 7. recovery replay for RECOVER nodes
  const postRecoveryNodes = recoverNodes(preRecoveryNodes, eventLog);

  // 8. safety shield loop
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

  // 9. track blackout start for any node now in BLACK
  trackBlackoutStart(updatedNodes);

  // 10. cell assignment
  const assignedNodes = assignSwarmCells(updatedNodes);
  const cells = groupCells(assignedNodes);

  // 11. alert generation
  const alerts = generateAlerts(assignedNodes, input.tick);

  // 12. mission health
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
