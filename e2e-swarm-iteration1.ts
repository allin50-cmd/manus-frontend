/**
 * E2E Swarm Iteration 1 — Full 30-tick end-to-end system trace
 *
 * Verifies every node lifecycle arc, FSM invariants, alert pipeline,
 * mission health, and operator override flow end-to-end.
 */

import {
  createInitialSwarm,
  runSimulationTick,
  queueOperatorOverrides,
} from "./sim/swarm-simulator";
import { SwarmNode, FailureState } from "./core/types";
import { SimulationResult } from "./sim/swarm-simulator";

// ─── harness state ────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const failures: string[] = [];
const history: SimulationResult[] = [];

function assert(label: string, condition: boolean): void {
  if (condition) {
    passed++;
    process.stdout.write(`  ✓  ${label}\n`);
  } else {
    failed++;
    failures.push(label);
    process.stdout.write(`  ✗  ${label}\n`);
  }
}

function section(title: string): void {
  process.stdout.write(`\n▶ ${title}\n`);
}

// ─── helpers ─────────────────────────────────────────────────────────────────
function node(result: SimulationResult, id: string): SwarmNode {
  const n = result.nodes.find((n) => n.id === id);
  if (!n) throw new Error(`node ${id} not found at tick ${result.tick}`);
  return n;
}

function stateAt(tick: number, id: string): FailureState {
  return node(history[tick - 1], id).state;
}

// ─── run 30 ticks ────────────────────────────────────────────────────────────
section("0. Simulation bootstrap");

let nodes = createInitialSwarm();
let eventLog: ReturnType<SimulationResult["eventLog"]["map"]> = [];

assert("createInitialSwarm returns 9 nodes", nodes.length === 9);
assert("all nodes start GREEN", nodes.every((n) => n.state === "GREEN"));
assert("all nodes start in primary-swarm", nodes.every((n) => n.cellId === "primary-swarm"));

const MISSION_ID = "E2E-MISSION-01";

for (let tick = 1; tick <= 30; tick++) {
  // Operator manually releases SENSOR-01 at tick 25 (loop-trap quarantine)
  if (tick === 25) {
    queueOperatorOverrides([
      { nodeId: "SENSOR-01", type: "releaseQuarantine" },
    ]);
  }

  const result = runSimulationTick({
    missionId: MISSION_ID,
    tick,
    nodes,
    eventLog: eventLog as any,
  });

  history.push(result);
  nodes = result.nodes;
  eventLog = result.eventLog as any;
}

// ─── Part A: Per-tick lifecycle assertions ────────────────────────────────────
section("A. Per-tick lifecycle — AUM-02 (comms failure → relay recovery)");
assert("tick 2: AUM-02 leaves GREEN (comms degraded)", stateAt(2, "AUM-02") !== "GREEN");
assert("tick 3: AUM-02 → BLACK", stateAt(3, "AUM-02") === "BLACK");
assert("tick 4: AIR-RELAY-01 comms boosted ≥ 80",
  node(history[3], "AIR-RELAY-01").confidence.comms >= 80);
// tick 5: relay recovery should push AUM-02 into RECOVER
const aum02_t5 = stateAt(5, "AUM-02");
assert("tick 5: AUM-02 exits BLACK (relay recovery)", aum02_t5 !== "BLACK");
// by tick 8 AUM-02 should be GREEN or AMBER (fully recovered)
const aum02_t8 = stateAt(8, "AUM-02");
assert("tick 8: AUM-02 recovered to GREEN or AMBER",
  aum02_t8 === "GREEN" || aum02_t8 === "AMBER");

section("B. Per-tick lifecycle — AUM-03 (safety dip → RED → auto-supervisor)");
assert("tick 3: AUM-03 → RED (safety<60)", stateAt(3, "AUM-03") === "RED");
assert("tick 4: AUM-03 stays RED (safety still low)", stateAt(4, "AUM-03") === "RED");
assert("tick 5: AUM-03 stays RED (safety still low)", stateAt(5, "AUM-03") === "RED");
// tick 6: safety restores to 80 → auto-supervisor approves
assert("tick 6: AUM-03 exits RED (auto-supervisor, safety=80)",
  stateAt(6, "AUM-03") !== "RED");
assert("tick 7: AUM-03 GREEN (fully recovered)", stateAt(7, "AUM-03") === "GREEN");

section("C. Per-tick lifecycle — AUM-04 (GNSS spoofing → QUARANTINE → auto-release)");
assert("tick 6: AUM-04 still GREEN (GNSS attack just starting)",
  stateAt(6, "AUM-04") === "GREEN" || stateAt(6, "AUM-04") === "AMBER");
assert("tick 7: AUM-04 AMBER (nav_integrity degrading)",
  stateAt(7, "AUM-04") === "AMBER");
assert("tick 8: AUM-04 AMBER (GNSS still suspected)", stateAt(8, "AUM-04") === "AMBER");
assert("tick 10: AUM-04 → QUARANTINE (nav_integrity=0, confirmed spoofing)",
  stateAt(10, "AUM-04") === "QUARANTINE");
assert("tick 11: AUM-04 stays QUARANTINE (locked)", stateAt(11, "AUM-04") === "QUARANTINE");
assert("tick 15: AUM-04 still QUARANTINE (GNSS still degraded)",
  stateAt(15, "AUM-04") === "QUARANTINE");
// tick 16+: hardware recovery starts; auto-supervisor clears at tick ~22
const aum04_t22 = stateAt(22, "AUM-04");
const aum04_t25 = stateAt(25, "AUM-04");
assert("tick 22–25: AUM-04 auto-released from QUARANTINE (scores recovered)",
  aum04_t22 !== "QUARANTINE" || aum04_t25 !== "QUARANTINE");
// final state: should be GREEN or AMBER by tick 28
const aum04_t28 = stateAt(28, "AUM-04");
assert("tick 28: AUM-04 GREEN or AMBER (GNSS fully restored)",
  aum04_t28 === "GREEN" || aum04_t28 === "AMBER");

section("D. Per-tick lifecycle — SENSOR-01 (clock attack → recovery loop → QUARANTINE)");
assert("tick 7: SENSOR-01 still GREEN (clock_health=65, above threshold)",
  stateAt(7, "SENSOR-01") === "GREEN" || stateAt(7, "SENSOR-01") === "AMBER");
assert("tick 8: SENSOR-01 → BLACK (clock_health=30, <40)",
  stateAt(8, "SENSOR-01") === "BLACK");
// SENSOR-01 will cycle BLACK → RECOVER → BLACK multiple times
// After 3 cycles it gets QUARANTINE (recovery loop trap)
const sensor_states = history.slice(7, 20).map((r) => node(r, "SENSOR-01").state);
const hitQuarantine = sensor_states.some((s) => s === "QUARANTINE");
assert("tick 8–20: SENSOR-01 hits QUARANTINE (recovery loop trap)", hitQuarantine);
// Find first QUARANTINE tick
const qtick = history.findIndex((r) => node(r, "SENSOR-01").state === "QUARANTINE");
assert("SENSOR-01 quarantine tick is 10–16",
  qtick >= 9 && qtick <= 15); // index = tick-1

// SENSOR-01 stays QUARANTINE until manual release at tick 25
assert("tick 20: SENSOR-01 still QUARANTINE (no manual release yet)",
  stateAt(20, "SENSOR-01") === "QUARANTINE");
assert("tick 24: SENSOR-01 still QUARANTINE (manual release at tick 25)",
  stateAt(24, "SENSOR-01") === "QUARANTINE");
// After operator release at tick 25, clock_health recovering → should exit
const sensor_t26 = stateAt(26, "SENSOR-01");
const sensor_t27 = stateAt(27, "SENSOR-01");
assert("tick 26–27: SENSOR-01 exits QUARANTINE after manual release",
  sensor_t26 !== "QUARANTINE" || sensor_t27 !== "QUARANTINE");

section("E. Per-tick lifecycle — AUM-05 (consensus poisoning → QUARANTINE → auto-release)");
assert("tick 8: AUM-05 starts consensus poisoning (mission=100, consensus=100)",
  node(history[7], "AUM-05").confidence.mission === 100 &&
  node(history[7], "AUM-05").confidence.consensus === 100);
// trust degrades: tick 12 = trust=20, tick 13 = trust=0 → QUARANTINE
assert("tick 12: AUM-05 AMBER or QUARANTINE (trust<40)",
  stateAt(12, "AUM-05") === "AMBER" || stateAt(12, "AUM-05") === "QUARANTINE");
assert("tick 13: AUM-05 → QUARANTINE (trust<10, confirmed poisoning)",
  stateAt(13, "AUM-05") === "QUARANTINE");
assert("tick 17: AUM-05 still QUARANTINE (trust=0, ASRP intervention pending)",
  stateAt(17, "AUM-05") === "QUARANTINE");
// tick 18+: trust starts recovering; auto-supervisor releases at ~tick 22
const aum05_t22 = stateAt(22, "AUM-05");
const aum05_t25 = stateAt(25, "AUM-05");
assert("tick 22–25: AUM-05 auto-released from QUARANTINE (trust recovered)",
  aum05_t22 !== "QUARANTINE" || aum05_t25 !== "QUARANTINE");
const aum05_t28 = stateAt(28, "AUM-05");
assert("tick 28: AUM-05 GREEN or AMBER (poisoning cleared)",
  aum05_t28 === "GREEN" || aum05_t28 === "AMBER");

section("F. Stable nodes — ASRP-01, AUM-01, AIR-RELAY-02");
["ASRP-01", "AUM-01", "AIR-RELAY-02"].forEach((id) => {
  const states = history.map((r) => node(r, id).state);
  const everBad = states.some((s) => s === "RED" || s === "BLACK" || s === "QUARANTINE");
  assert(`${id}: never enters RED/BLACK/QUARANTINE`, !everBad);
  assert(`${id} tick 30: GREEN`, stateAt(30, id) === "GREEN");
});

// AIR-RELAY-01 gets a comms boost at tick 4 — should stay healthy
const relay1_states = history.map((r) => node(r, "AIR-RELAY-01").state);
const relay1_everQuarantined = relay1_states.some((s) => s === "QUARANTINE");
assert("AIR-RELAY-01: never QUARANTINE", !relay1_everQuarantined);
assert("AIR-RELAY-01 tick 30: GREEN", stateAt(30, "AIR-RELAY-01") === "GREEN");

// ─── Part B: Per-tick FSM invariants (every tick, every node) ─────────────────
section("G. FSM invariants — all 30 ticks × 9 nodes");

const VALID_STATES: FailureState[] = ["GREEN", "AMBER", "RED", "BLACK", "RECOVER", "QUARANTINE"];
// Must match assignSwarmCells() in core/cell-manager.ts
const STATE_CELL: Record<FailureState, string> = {
  GREEN: "primary-swarm",
  AMBER: "degraded-cell",
  RED: "safe-hold-cell",
  BLACK: "blackout-cell",
  RECOVER: "recovery-cell",
  QUARANTINE: "quarantine-cell",
};

let invariantViolations = 0;

for (const result of history) {
  for (const n of result.nodes) {
    // valid state
    if (!VALID_STATES.includes(n.state)) {
      invariantViolations++;
      failures.push(`tick ${result.tick} ${n.id}: invalid state "${n.state}"`);
    }
    // cellId matches state
    const expectedCell = STATE_CELL[n.state];
    if (n.cellId !== expectedCell) {
      invariantViolations++;
      failures.push(
        `tick ${result.tick} ${n.id}: state=${n.state} but cellId=${n.cellId} (expected ${expectedCell})`
      );
    }
    // all confidence scores clamped 0-100
    for (const [k, v] of Object.entries(n.confidence)) {
      if (v < 0 || v > 100) {
        invariantViolations++;
        failures.push(
          `tick ${result.tick} ${n.id}: confidence.${k}=${v} out of [0,100]`
        );
      }
    }
    // RECOVER nodes must have recoveryAttempts ≥ 1
    if (n.state === "RECOVER" && (n.recoveryAttempts ?? 0) < 1) {
      invariantViolations++;
      failures.push(
        `tick ${result.tick} ${n.id}: RECOVER state but recoveryAttempts=${n.recoveryAttempts}`
      );
    }
    // QUARANTINE nodes with recoveryAttempts=0 and all scores ≥65 should
    // have operatorResumeApproved (auto-supervisor handles this next tick)
    // — we don't check this here; it's a pipeline ordering artifact.
  }
  // At least ASRP-01 must always be present
  if (!result.nodes.find((n) => n.id === "ASRP-01")) {
    invariantViolations++;
    failures.push(`tick ${result.tick}: ASRP-01 missing from node list`);
  }
}

if (invariantViolations === 0) {
  passed++;
  process.stdout.write(`  ✓  0 FSM invariant violations across 270 node-ticks (30t × 9n)\n`);
} else {
  failed += invariantViolations;
  process.stdout.write(`  ✗  ${invariantViolations} FSM invariant violations\n`);
}

// ─── Part C: Alert pipeline ───────────────────────────────────────────────────
section("H. Alert pipeline");

const allAlerts = history.flatMap((r) => r.alerts);
const alertCategories = new Set(allAlerts.map((a) => a.category));

assert("SPOOFING alerts generated (AUM-04)", alertCategories.has("SPOOFING"));
assert("CLOCK_ATTACK alerts generated (SENSOR-01)", alertCategories.has("CLOCK_ATTACK"));
assert("QUARANTINE alerts generated", alertCategories.has("QUARANTINE"));
assert("CONSENSUS_POISONING alerts generated (AUM-05)", alertCategories.has("CONSENSUS_POISONING"));
assert("STATE_CHANGE alerts generated", alertCategories.has("STATE_CHANGE"));
assert("All alerts have valid severity",
  allAlerts.every((a) => ["INFO", "WARNING", "CRITICAL"].includes(a.severity)));
assert("All alerts have valid category",
  allAlerts.every((a) =>
    ["STATE_CHANGE", "SPOOFING", "CLOCK_ATTACK", "QUARANTINE", "MISSION_HEALTH", "CONSENSUS_POISONING"]
      .includes(a.category)));
assert("All alerts have non-empty alertId", allAlerts.every((a) => a.alertId.startsWith("ALT-")));
assert("All alerts have tick ≥ 1", allAlerts.every((a) => a.tick >= 1));

// Cooldown: no same node+category pair within cooldown window
let cooldownViolations = 0;
const alertsByKey = new Map<string, number[]>();
for (const a of allAlerts) {
  const key = `${a.nodeId}:${a.category}`;
  if (!alertsByKey.has(key)) alertsByKey.set(key, []);
  alertsByKey.get(key)!.push(a.tick);
}
const COOLDOWNS: Record<string, number> = {
  STATE_CHANGE: 4, SPOOFING: 3, CLOCK_ATTACK: 3,
  QUARANTINE: 5, MISSION_HEALTH: 5, CONSENSUS_POISONING: 3,
};
for (const [key, ticks] of alertsByKey) {
  const cat = key.split(":")[1] as string;
  const cd = COOLDOWNS[cat] ?? 1;
  for (let i = 1; i < ticks.length; i++) {
    if (ticks[i] - ticks[i - 1] < cd) cooldownViolations++;
  }
}
assert("Alert cooldown respected for all categories", cooldownViolations === 0);

// ─── Part D: Mission health ────────────────────────────────────────────────────
section("I. Mission health transitions");

assert("tick 1: mission health NOMINAL", history[0].missionHealth.level === "NOMINAL");
// During peak attacks (tick 10-16), health should degrade
const peakHealth = history.slice(9, 16).map((r) => r.missionHealth.level);
assert("tick 10–16: mission health degrades (DEGRADED or CRITICAL or FAILED)",
  peakHealth.some((s) => s !== "NOMINAL"));
// ASRP always online (it stays GREEN throughout)
assert("tick 1–30: ASRP always online",
  history.every((r) => r.missionHealth.asrpOnline === true));
// Mission health score is always 0-100
assert("mission health score always 0-100",
  history.every((r) => r.missionHealth.score >= 0 && r.missionHealth.score <= 100));
// By tick 28–30, recovery should restore NOMINAL or DEGRADED
const lateHealth = history.slice(27).map((r) => r.missionHealth.level);
assert("tick 28–30: mission health recovers (NOMINAL or DEGRADED)",
  lateHealth.every((s) => s === "NOMINAL" || s === "DEGRADED"));

// ─── Part E: Operator override ────────────────────────────────────────────────
section("J. Operator override — SENSOR-01 manual release");

// SENSOR-01 was released at tick 25; check recovery progressed
const sensor_recov = node(history[24], "SENSOR-01").recoveryAttempts ?? 0;
assert("SENSOR-01 at tick 25: recoveryAttempts reset to 0 after release",
  sensor_recov === 0);
// After exit from QUARANTINE the node transitions to GREEN/AMBER — no longer QUARANTINE
assert("SENSOR-01 at tick 25: exits QUARANTINE state after manual release",
  node(history[24], "SENSOR-01").state !== "QUARANTINE");

// ─── Part F: Determinism ──────────────────────────────────────────────────────
section("K. Determinism — two independent 30-tick runs produce identical final states");

let nodes2 = createInitialSwarm();
let eventLog2: any[] = [];

for (let tick = 1; tick <= 30; tick++) {
  if (tick === 25) {
    queueOperatorOverrides([{ nodeId: "SENSOR-01", type: "releaseQuarantine" }]);
  }
  const r = runSimulationTick({ missionId: MISSION_ID, tick, nodes: nodes2, eventLog: eventLog2 });
  nodes2 = r.nodes;
  eventLog2 = r.eventLog as any;
}

const finalRun1 = history[29].nodes.map((n) => `${n.id}:${n.state}`).sort().join("|");
const finalRun2 = nodes2.map((n) => `${n.id}:${n.state}`).sort().join("|");
assert("Run 1 === Run 2 final states (deterministic)", finalRun1 === finalRun2);

// ─── Part G: Full state dump ───────────────────────────────────────────────────
section("L. Final state at tick 30");

const finalNodes = history[29].nodes;
process.stdout.write("\n  Node states at tick 30:\n");
for (const n of finalNodes) {
  process.stdout.write(
    `    ${n.id.padEnd(14)} ${n.state.padEnd(10)} comms=${String(n.confidence.comms).padStart(3)}` +
    ` nav=${String(n.confidence.navigation).padStart(3)}` +
    ` safety=${String(n.confidence.safety).padStart(3)}` +
    ` trust=${String(n.confidence.trust ?? 100).padStart(3)}` +
    ` nav_i=${String(n.confidence.nav_integrity ?? 100).padStart(3)}` +
    ` clk=${String(n.confidence.clock_health ?? 100).padStart(3)}` +
    ` recov=${n.recoveryAttempts ?? 0}\n`
  );
}

// ─── Summary ──────────────────────────────────────────────────────────────────
process.stdout.write("\n" + "═".repeat(60) + "\n");
process.stdout.write(`  E2E SWARM ITERATION 1\n`);
process.stdout.write(`  Passed: ${passed}/${passed + failed}\n`);

if (failures.length > 0) {
  process.stdout.write(`\n  FAILURES:\n`);
  for (const f of failures) {
    process.stdout.write(`    ✗  ${f}\n`);
  }
}

if (failed === 0) {
  process.stdout.write(`  ALL CHECKS PASSED — system is clean.\n`);
} else {
  process.stdout.write(`  ${failed} FAILURE(S) — see above.\n`);
}
process.stdout.write("═".repeat(60) + "\n");

process.exit(failed === 0 ? 0 : 1);
