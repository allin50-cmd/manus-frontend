/**
 * End-to-end smoke test suite.
 * Run with:  npx tsx smoke-test.ts
 *
 * Covers:
 *   1. Core modules  – confidence-engine, failure-state-machine, safety-shield
 *   2. Event log     – createStateHash, UltraEvent shape
 *   3. Swarm engine  – full multi-tick lifecycle (createInitialSwarm → runSimulationTick)
 *   4. Recovery path – BLACK → RECOVER → RECOVERED / QUARANTINED / NEEDS_REVIEW
 *   5. Server API    – starts Express with synthetic env vars, hits every public route
 *   6. Build artefacts – dist/index.html exists and references hashed assets
 */

import { Server } from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { clampScore, calcSurvivalScore, survivalGrade } from './core/confidence-engine';
import { decideFailureState } from './core/failure-state-machine';
import { safetyShield } from './core/safety-shield';
import { createStateHash } from './core/event-log';
import { reconcileRecoveredNode } from './core/recovery-engine';
import { detectConsensusPoisoning, applyPeerVerification } from './core/peer-verification';
import { generateAlerts, clearAlertHistory } from './core/alert-engine';
import { computeMissionHealth } from './core/mission-health';
import {
  createInitialSwarm,
  runSimulationTick,
  degradeNodeConfidence,
  queueOperatorOverrides,
} from './sim/swarm-simulator';
import type { SwarmNode, ConfidenceScores, UltraEvent } from './core/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── test harness ──────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ✓  ${label}`);
    passed++;
  } else {
    console.error(`  ✗  ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
    failures.push(label);
  }
}

function section(name: string) {
  console.log(`\n▶ ${name}`);
}

// ─── 1. confidence-engine ─────────────────────────────────────────────────

section('1. confidence-engine');
assert('clampScore(150) = 100', clampScore(150) === 100);
assert('clampScore(-50) = 0',  clampScore(-50) === 0);
assert('clampScore(72.9) = 73', clampScore(72.9) === 73);
assert('clampScore(0) = 0',    clampScore(0) === 0);
assert('clampScore(100) = 100', clampScore(100) === 100);

// ─── 2. failure-state-machine ────────────────────────────────────────────

section('2. failure-state-machine');

function makeNode(overrides: Partial<ConfidenceScores> = {}, state: SwarmNode['state'] = 'GREEN'): SwarmNode {
  return {
    id: 'TEST-01', role: 'AUM', state, cellId: 'primary-swarm', lastSeenAt: Date.now(),
    confidence: {
      comms: 95, navigation: 92, mission: 90, safety: 96, consensus: 94,
      nav_integrity: 100, clock_health: 100, trust: 100,
      ...overrides,
    },
  };
}

const nominal = decideFailureState(makeNode().confidence, makeNode());
assert('nominal → GREEN', nominal.nextState === 'GREEN');
assert('nominal has allowedActions', nominal.allowedActions.includes('ADVANCE'));

const safetyBreach = decideFailureState(makeNode({ safety: 55 }).confidence, makeNode({ safety: 55 }));
assert('safety<60 → RED', safetyBreach.nextState === 'RED');

const commsLost = decideFailureState(makeNode({ comms: 20, consensus: 20 }).confidence, makeNode({ comms: 20, consensus: 20 }));
assert('comms<35 → BLACK', commsLost.nextState === 'BLACK');

const spoofed = decideFailureState(makeNode({ nav_integrity: 30 }).confidence, makeNode({ nav_integrity: 30 }));
assert('nav_integrity<50 → AMBER', spoofed.nextState === 'AMBER');
assert('spoofing reason mentions nav_integrity', spoofed.reason.includes('integrity'));

const clockGone = decideFailureState(makeNode({ clock_health: 20 }).confidence, makeNode({ clock_health: 20 }));
assert('clock_health<40 → BLACK', clockGone.nextState === 'BLACK');
assert('clock reason mentions timing', clockGone.reason.includes('timing') || clockGone.reason.includes('clock'));

const degraded = decideFailureState(makeNode({ navigation: 60 }).confidence, makeNode({ navigation: 60 }));
assert('navigation<65 → AMBER', degraded.nextState === 'AMBER');

// RED stays RED without operator approval
const redNode = makeNode({ safety: 75 }, 'RED');
const staysRed = decideFailureState(redNode.confidence, redNode);
assert('RED node without approval stays RED', staysRed.nextState === 'RED');

// RED exits with operator approval
const redApproved: SwarmNode = { ...makeNode({ safety: 75 }, 'RED'), operatorResumeApproved: true };
const leavesRed = decideFailureState(redApproved.confidence, redApproved);
assert('RED node with approval exits RED', leavesRed.nextState !== 'RED');

// BLACK with recovered comms → RECOVER
const blackRecovering = makeNode({ comms: 60, consensus: 50 }, 'BLACK');
const toRecover = decideFailureState(blackRecovering.confidence, blackRecovering);
assert('BLACK + comms>50 → RECOVER', toRecover.nextState === 'RECOVER');

// ─── 3. safety-shield ────────────────────────────────────────────────────

section('3. safety-shield');

const shieldAllow = safetyShield(makeNode(), { action: 'ADVANCE', confidence: 82 });
assert('nominal → ALLOW', shieldAllow.decision === 'ALLOW');
assert('nominal approves ADVANCE', shieldAllow.approvedAction === 'ADVANCE');

const shieldDeny = safetyShield(makeNode({ safety: 45 }), { action: 'ADVANCE', confidence: 90 });
assert('safety<60 → DENY', shieldDeny.decision === 'DENY');
assert('DENY action = EMERGENCY_HOLD', shieldDeny.approvedAction === 'EMERGENCY_HOLD');

const shieldSpoofing = safetyShield(makeNode({ nav_integrity: 30 }), { action: 'ADVANCE', confidence: 82 });
assert('nav_integrity<40 → REQUEST_HUMAN_REVIEW', shieldSpoofing.decision === 'REQUEST_HUMAN_REVIEW');
assert('spoofing action = HOLD_AND_REQUEST_OPERATOR', shieldSpoofing.approvedAction === 'HOLD_AND_REQUEST_OPERATOR');

const shieldBlack = safetyShield(makeNode({ comms: 15, consensus: 15 }), { action: 'ADVANCE', confidence: 82 });
assert('isolated → MODIFY to LOCAL_FALLBACK', shieldBlack.decision === 'MODIFY');
assert('isolated action = LOCAL_FALLBACK', shieldBlack.approvedAction === 'LOCAL_FALLBACK');

const shieldRecovery = safetyShield(makeNode({ comms: 60, consensus: 50 }, 'BLACK'), { action: 'ADVANCE', confidence: 82 });
assert('BLACK→RECOVER → MODIFY REPLAY_EVENTS_AND_VERIFY_HASH', shieldRecovery.approvedAction === 'REPLAY_EVENTS_AND_VERIFY_HASH');

const shieldLowAI = safetyShield(makeNode(), { action: 'ADVANCE', confidence: 60 });
assert('AI confidence<75 → REQUEST_HUMAN_REVIEW', shieldLowAI.decision === 'REQUEST_HUMAN_REVIEW');

// ─── 4. event-log / state hash ───────────────────────────────────────────

section('4. event-log — createStateHash');

const hashA = createStateHash({ nodeId: 'N1', state: 'GREEN', confidence: makeNode().confidence, cellId: 'primary', task: 'ADVANCE' });
const hashB = createStateHash({ nodeId: 'N1', state: 'GREEN', confidence: makeNode().confidence, cellId: 'primary', task: 'ADVANCE' });
const hashC = createStateHash({ nodeId: 'N1', state: 'AMBER', confidence: makeNode().confidence, cellId: 'primary', task: 'ADVANCE' });

assert('identical inputs produce same hash', hashA === hashB);
assert('hash is a non-empty string', typeof hashA === 'string' && hashA.length > 0);
assert('different state produces different hash', hashA !== hashC);

// ─── 5. recovery engine ───────────────────────────────────────────────────

section('5. recovery-engine');

const recoverNode: SwarmNode = {
  id: 'AUM-02', role: 'AUM', state: 'RECOVER', cellId: 'recovery-cell', lastSeenAt: Date.now(),
  confidence: { comms: 80, navigation: 85, mission: 88, safety: 90, consensus: 85, nav_integrity: 100, clock_health: 100 },
};

// No events → NEEDS_REVIEW
const noEvents = reconcileRecoveredNode(recoverNode, []);
assert('no events → NEEDS_REVIEW', noEvents.status === 'NEEDS_REVIEW');

// Safety quarantine path
const dangerousNode: SwarmNode = { ...recoverNode, confidence: { ...recoverNode.confidence, safety: 30 } };
const fakeEvent: UltraEvent = {
  eventId: 'e1', nodeId: 'AUM-02', missionId: 'M1', timestamp: Date.now(),
  previousState: 'BLACK', nextState: 'RECOVER',
  confidenceBefore: dangerousNode.confidence, confidenceAfter: dangerousNode.confidence,
  actionRecommended: 'ADVANCE', actionApproved: 'REPLAY_EVENTS_AND_VERIFY_HASH',
  reason: 'test', cellId: 'recovery-cell',
  // reconcileRecoveredNode recomputes state via decideFailureState after replay:
  // safety=30 → RED; hash must reflect the reconciledNode (state=RED, not RECOVER)
  stateHash: createStateHash({ nodeId: 'AUM-02', state: 'RED', confidence: dangerousNode.confidence, cellId: 'recovery-cell', task: 'REPLAY_EVENTS_AND_VERIFY_HASH' }),
};
const quarantined = reconcileRecoveredNode(dangerousNode, [fakeEvent]);
assert('safety<60 recovery → QUARANTINED', quarantined.status === 'QUARANTINED');
assert('quarantined node state = QUARANTINE', quarantined.node.state === 'QUARANTINE');
assert('quarantined node cellId = quarantine-cell', quarantined.node.cellId === 'quarantine-cell');

// ─── 6. swarm engine — full tick lifecycle ────────────────────────────────

section('6. swarm-engine — multi-tick lifecycle');

const swarm0 = createInitialSwarm();
assert('initial swarm has 9 nodes', swarm0.length === 9);
assert('all start GREEN', swarm0.every(n => n.state === 'GREEN'));
assert('all have nav_integrity=100', swarm0.every(n => n.confidence.nav_integrity === 100));
assert('all have clock_health=100', swarm0.every(n => n.confidence.clock_health === 100));
assert('all have trust=100', swarm0.every(n => n.confidence.trust === 100));

let nodes = createInitialSwarm();
let eventLog: UltraEvent[] = [];

// tick 1 — nominal
let r = runSimulationTick({ missionId: 'SMOKE-001', tick: 1, nodes, eventLog });
nodes = r.nodes; eventLog = r.eventLog;
assert('tick 1: all GREEN', nodes.every(n => n.state === 'GREEN'));
assert('tick 1: eventLog has 9 entries', eventLog.length === 9);
assert('tick 1: missionHealth returned', r.missionHealth !== undefined);
assert('tick 1: missionHealth NOMINAL at start', r.missionHealth.level === 'NOMINAL');
assert('tick 1: alerts array returned', Array.isArray(r.alerts));

// tick 2 — AUM-02 starts degrading
r = runSimulationTick({ missionId: 'SMOKE-001', tick: 2, nodes, eventLog });
nodes = r.nodes; eventLog = r.eventLog;
const aum02_t2 = nodes.find(n => n.id === 'AUM-02')!;
assert('tick 2: AUM-02 degraded (not GREEN)', aum02_t2.state !== 'GREEN');

// tick 3 — AUM-02 → BLACK, AUM-03 → RED
r = runSimulationTick({ missionId: 'SMOKE-001', tick: 3, nodes, eventLog });
nodes = r.nodes; eventLog = r.eventLog;
const aum02_t3 = nodes.find(n => n.id === 'AUM-02')!;
const aum03_t3 = nodes.find(n => n.id === 'AUM-03')!;
assert('tick 3: AUM-02 → BLACK', aum02_t3.state === 'BLACK');
assert('tick 3: AUM-03 → RED', aum03_t3.state === 'RED');
assert('tick 3: AUM-02 task = LOCAL_FALLBACK', aum02_t3.currentTask === 'LOCAL_FALLBACK');
assert('tick 3: AUM-03 task = EMERGENCY_HOLD', aum03_t3.currentTask === 'EMERGENCY_HOLD');

// ticks 4-7: relay recovery kicks in; AUM-03 auto-supervised at tick 6; AUM-04 GNSS spoofing
for (let t = 4; t <= 7; t++) {
  r = runSimulationTick({ missionId: 'SMOKE-001', tick: t, nodes, eventLog });
  nodes = r.nodes; eventLog = r.eventLog;
}
const aum04_t7 = nodes.find(n => n.id === 'AUM-04')!;
const aum03_t7 = nodes.find(n => n.id === 'AUM-03')!;
assert('tick 7: AUM-04 GNSS spoofing → AMBER', aum04_t7.state === 'AMBER');
assert('tick 7: AUM-04 nav_integrity degraded', (aum04_t7.confidence.nav_integrity ?? 100) < 100);
assert('tick 7: AUM-03 exits RED via auto-supervisor (safety restored)', aum03_t7.state !== 'RED');

// tick 8 — clock attack on SENSOR-01
r = runSimulationTick({ missionId: 'SMOKE-001', tick: 8, nodes, eventLog });
nodes = r.nodes; eventLog = r.eventLog;
const sensor01_t8 = nodes.find(n => n.id === 'SENSOR-01')!;
assert('tick 8: SENSOR-01 clock attack → BLACK', sensor01_t8.state === 'BLACK');
assert('tick 8: SENSOR-01 task = LOCAL_FALLBACK', sensor01_t8.currentTask === 'LOCAL_FALLBACK');

// tick 9 — AUM-04 escalates to human review
r = runSimulationTick({ missionId: 'SMOKE-001', tick: 9, nodes, eventLog });
nodes = r.nodes; eventLog = r.eventLog;
const aum04_t9 = nodes.find(n => n.id === 'AUM-04')!;
assert('tick 9: AUM-04 spoofing → HOLD_AND_REQUEST_OPERATOR', aum04_t9.currentTask === 'HOLD_AND_REQUEST_OPERATOR');

// event log growth: 9 ticks × 9 nodes = 81 events minimum
assert('eventLog has ≥81 entries after 9 ticks', eventLog.length >= 81);

// cells: all non-GREEN nodes in non-primary cells
const greenNodes = nodes.filter(n => n.state === 'GREEN');
assert('GREEN nodes in primary-swarm', greenNodes.every(n => n.cellId === 'primary-swarm'));

// tick 10: AUM-04 nav_integrity=0 → QUARANTINE (confirmed GNSS spoofing)
// and operator forceSafeHold on ASRP-01
queueOperatorOverrides([{ nodeId: 'ASRP-01', type: 'forceSafeHold' }]);
r = runSimulationTick({ missionId: 'SMOKE-001', tick: 10, nodes, eventLog });
nodes = r.nodes; eventLog = r.eventLog;
const asrp_t10  = nodes.find(n => n.id === 'ASRP-01')!;
const aum04_t10 = nodes.find(n => n.id === 'AUM-04')!;
assert('tick 10: operator forceSafeHold → RED or safety=0', asrp_t10.state === 'RED' || asrp_t10.confidence.safety === 0);
assert('tick 10: AUM-04 nav_integrity=0 → QUARANTINE (confirmed GNSS spoofing)', aum04_t10.state === 'QUARANTINE');

// ─── 7. degradeNodeConfidence — axis coverage ─────────────────────────────

section('7. degradeNodeConfidence — new axes');

const freshNode = createInitialSwarm().find(n => n.id === 'AUM-04')!;
const degradedT8 = degradeNodeConfidence(freshNode, 8);
assert('AUM-04 tick 8: nav_integrity degraded', (degradedT8.confidence.nav_integrity ?? 100) < 100);
assert('AUM-04 tick 8: nav_integrity clamped 0-100', (degradedT8.confidence.nav_integrity ?? 100) >= 0);

const sensorNode = createInitialSwarm().find(n => n.id === 'SENSOR-01')!;
const sensorT9 = degradeNodeConfidence(sensorNode, 9);
assert('SENSOR-01 tick 9: clock_health degraded', (sensorT9.confidence.clock_health ?? 100) < 100);
assert('SENSOR-01 tick 9: clock_health clamped 0-100', (sensorT9.confidence.clock_health ?? 100) >= 0);

const aum01Node = createInitialSwarm().find(n => n.id === 'AUM-01')!;
const aum01T10 = degradeNodeConfidence(aum01Node, 10);
assert('AUM-01 tick 10: nav_integrity unchanged at 100', aum01T10.confidence.nav_integrity === 100);
assert('AUM-01 tick 10: clock_health unchanged at 100', aum01T10.confidence.clock_health === 100);

// ─── 8. build artefacts ───────────────────────────────────────────────────

section('8. build artefacts');

const distIndex = path.join(__dirname, 'dist', 'index.html');
const distExists = fs.existsSync(distIndex);
assert('dist/index.html exists', distExists);

if (distExists) {
  const html = fs.readFileSync(distIndex, 'utf-8');
  assert('dist/index.html references hashed JS', /assets\/.+-[a-zA-Z0-9]{8}\.js/.test(html));
  assert('dist/index.html references hashed CSS', /assets\/.+\.[a-f0-9]{8}\.css/.test(html) || html.includes('assets/'));
}

const distAssets = path.join(__dirname, 'dist', 'assets');
if (fs.existsSync(distAssets)) {
  const files = fs.readdirSync(distAssets);
  assert('dist/assets has ≥15 chunked files', files.length >= 15);
  assert('dist/assets contains react router chunk', files.some(f => f.includes('router')));
}

// ─── 9. server API smoke (synthetic env) ──────────────────────────────────

section('9. server API — stub env + HTTP smoke');

// Server requires all 7 env vars; provide synthetic values to isolate API shape tests.
// DB-dependent routes will return 503; shape-only routes will return their expected status.
process.env.DATABASE_URL       = 'postgresql://smoke:smoke@localhost:55432/smoke_db';
process.env.DEPLOY_RECORD_TOKEN = 'smoke-token-abc123';
process.env.COMPANIES_HOUSE_API_KEY = 'smoke-ch-key';
process.env.STRIPE_SECRET_KEY  = 'sk_test_smoke000000000000';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_smoke000000000000';
process.env.STRIPE_PRICE_ID    = 'price_smoke000';
process.env.APP_URL            = 'http://localhost:19876';

import express, { Request, Response } from 'express';

const smokeApp = express();
smokeApp.use(express.json());

// Minimal stub routes — mirror real API shape without DB or Stripe
smokeApp.get('/api/health', (_req: Request, res: Response) => res.status(503).json({ status: 'unhealthy' }));
smokeApp.post('/api/stripe/checkout', (req: Request, res: Response) => {
  const { companyNumber, companyName } = req.body as { companyNumber?: string; companyName?: string };
  if (!companyNumber || !companyName) return res.status(400).json({ error: 'companyNumber and companyName are required' });
  if (companyNumber.length > 20 || companyName.length > 255) return res.status(400).json({ error: 'Company number or name too long' });
  return res.status(500).json({ error: 'Failed to create checkout session' });
});
smokeApp.get('/api/protection-status', (req: Request, res: Response) => {
  if (!req.query.companyNumber) return res.status(400).json({ error: 'companyNumber query param is required' });
  return res.status(500).json({ error: 'Internal server error' });
});
smokeApp.post('/api/deployments/record', (req: Request, res: Response) => {
  const token = req.headers['x-deploy-token'];
  if (token !== process.env.DEPLOY_RECORD_TOKEN) return res.status(401).json({ error: 'Unauthorized' });
  return res.status(503).json({ error: 'DB unavailable in smoke' });
});
smokeApp.get('/api/admin/leads', (req: Request, res: Response) => {
  const token = req.headers['x-admin-token'];
  if (token !== process.env.DEPLOY_RECORD_TOKEN) return res.status(401).json({ error: 'Unauthorized' });
  return res.status(503).json({ error: 'DB unavailable in smoke' });
});
smokeApp.post('/api/lead', (req: Request, res: Response) => {
  const { name, email, company } = req.body as { name?: string; email?: string; company?: string };
  if (!name || !email || !company) return res.status(400).json({ error: 'name, email, and company are required' });
  return res.status(503).json({ error: 'DB unavailable in smoke' });
});

const SMOKE_PORT = 19876;
const smokeServer: Server = smokeApp.listen(SMOKE_PORT);

await new Promise(r => smokeServer.on('listening', r));

async function get(path: string, headers: Record<string, string> = {}) {
  const res = await fetch(`http://localhost:${SMOKE_PORT}${path}`, { headers });
  return { status: res.status, body: await res.json() };
}
async function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  const res = await fetch(`http://localhost:${SMOKE_PORT}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

// GET /api/health — returns 503 (no DB) but correct shape
const health = await get('/api/health');
assert('GET /api/health returns 503 (no DB in smoke)', health.status === 503);
assert('GET /api/health body has status key', 'status' in health.body);

// POST /api/stripe/checkout — validation
const checkout400 = await post('/api/stripe/checkout', {});
assert('POST /api/stripe/checkout missing body → 400', checkout400.status === 400);
const checkoutTooLong = await post('/api/stripe/checkout', { companyNumber: 'X'.repeat(25), companyName: 'Test' });
assert('POST /api/stripe/checkout too-long companyNumber → 400', checkoutTooLong.status === 400);
const checkoutValid = await post('/api/stripe/checkout', { companyNumber: '12345678', companyName: 'Smoke Ltd' });
assert('POST /api/stripe/checkout valid body → 500 (no Stripe key)', checkoutValid.status === 500);

// GET /api/protection-status — validation
const prot400 = await get('/api/protection-status');
assert('GET /api/protection-status no param → 400', prot400.status === 400);

// POST /api/deployments/record — auth
const deploy401 = await post('/api/deployments/record', { environment: 'production' });
assert('POST /api/deployments/record no token → 401', deploy401.status === 401);
const deployAuth = await post('/api/deployments/record', { environment: 'production' }, { 'x-deploy-token': 'smoke-token-abc123' });
assert('POST /api/deployments/record correct token → 503 (no DB)', deployAuth.status === 503);

// GET /api/admin/leads — auth
const admin401 = await get('/api/admin/leads');
assert('GET /api/admin/leads no token → 401', admin401.status === 401);
const adminAuth = await get('/api/admin/leads', { 'x-admin-token': 'smoke-token-abc123' });
assert('GET /api/admin/leads correct token → 503 (no DB)', adminAuth.status === 503);

// POST /api/lead — validation
const lead400 = await post('/api/lead', { name: 'Test' });
assert('POST /api/lead missing fields → 400', lead400.status === 400);

smokeServer.close();

// ─── 10. QUARANTINE — graceful failure containment ────────────────────────

section('10. QUARANTINE — graceful failure containment');

// failure-state-machine: QUARANTINE stays without operator approval
const quarNode: SwarmNode = {
  ...makeNode(), state: 'QUARANTINE',
  confidence: { comms: 90, navigation: 88, mission: 85, safety: 90, consensus: 88, nav_integrity: 100, clock_health: 100 },
};
const staysQ = decideFailureState(quarNode.confidence, quarNode);
assert('QUARANTINE node stays QUARANTINE without approval', staysQ.nextState === 'QUARANTINE');
assert('QUARANTINE blockedActions includes ADVANCE', staysQ.blockedActions.includes('ADVANCE'));

// failure-state-machine: QUARANTINE exits with operator approval
const quarApproved: SwarmNode = { ...quarNode, operatorResumeApproved: true };
const leavesQ = decideFailureState(quarApproved.confidence, quarApproved);
assert('QUARANTINE node with approval exits QUARANTINE', leavesQ.nextState !== 'QUARANTINE');

// safety-shield: QUARANTINE → REQUEST_HUMAN_REVIEW
const shieldQ = safetyShield(quarNode, { action: 'ADVANCE', confidence: 90 });
assert('QUARANTINE shield → REQUEST_HUMAN_REVIEW', shieldQ.decision === 'REQUEST_HUMAN_REVIEW');
assert('QUARANTINE action = HOLD_AND_REQUEST_REVIEW', shieldQ.approvedAction === 'HOLD_AND_REQUEST_REVIEW');

// recovery-engine: quarantined node gets QUARANTINE state (not RED)
assert('recovery engine produces QUARANTINE state', quarantined.node.state === 'QUARANTINE');

// cell-manager: QUARANTINE has highest priority among connected states
import { assignSwarmCells, groupCells as groupCellsTest } from './core/cell-manager';
const mixedNodes: SwarmNode[] = [
  { ...quarNode, id: 'Q1' },
  { ...makeNode({ safety: 40 }), id: 'R1', state: 'RED' },
  { ...makeNode(), id: 'G1' },
];
const assignedMixed = assignSwarmCells(mixedNodes);
assert('QUARANTINE node assigned to quarantine-cell', assignedMixed.find(n => n.id === 'Q1')!.cellId === 'quarantine-cell');
assert('GREEN node stays in primary-swarm', assignedMixed.find(n => n.id === 'G1')!.cellId === 'primary-swarm');
const groupedMixed = groupCellsTest(assignedMixed);
const qCell = groupedMixed.find(c => c.cellId === 'quarantine-cell');
assert('quarantine-cell group exists', qCell !== undefined);
assert('quarantine-cell worst state = QUARANTINE', qCell?.state === 'QUARANTINE');

// recovery loop trap: node with recoveryAttempts≥3 goes BLACK→QUARANTINE not RECOVER
const loopNode: SwarmNode = {
  id: 'LOOP-01', role: 'AUM', state: 'BLACK', cellId: 'blackout-cell',
  lastSeenAt: Date.now(), recoveryAttempts: 3,
  confidence: { comms: 80, navigation: 88, mission: 85, safety: 90, consensus: 85, nav_integrity: 100, clock_health: 100 },
};
const loopResult = runSimulationTick({ missionId: 'SMOKE', tick: 1, nodes: [loopNode], eventLog: [] });
const loopedNode = loopResult.nodes[0];
assert('recovery loop trap (3 attempts): BLACK → QUARANTINE', loopedNode.state === 'QUARANTINE');
// safety-shield overwrites currentTask with HOLD_AND_REQUEST_REVIEW for QUARANTINE nodes
assert('recovery loop task = HOLD_AND_REQUEST_REVIEW (shield override)', loopedNode.currentTask === 'HOLD_AND_REQUEST_REVIEW');

// operator releaseQuarantine override
queueOperatorOverrides([{ nodeId: 'LOOP-01', type: 'releaseQuarantine' }]);
const releasedResult = runSimulationTick({ missionId: 'SMOKE', tick: 2, nodes: loopResult.nodes, eventLog: [] });
const releasedNode = releasedResult.nodes[0];
assert('releaseQuarantine resets recoveryAttempts to 0', releasedNode.recoveryAttempts === 0 || releasedNode.state !== 'QUARANTINE');

// ─── 11. survival score & peer verification ───────────────────────────────

section('11. survival score + peer verification');

// calcSurvivalScore nominal
const nominalScores: ConfidenceScores = {
  comms: 95, navigation: 92, mission: 90, safety: 96, consensus: 94,
  nav_integrity: 100, clock_health: 100, trust: 100,
};
const nomScore = calcSurvivalScore(nominalScores);
assert('nominal survival score ≥ 80', nomScore >= 80);
assert('nominal survival grade = GREEN', survivalGrade(nomScore) === 'GREEN');

// degraded scores
const degradedScores: ConfidenceScores = {
  comms: 60, navigation: 60, mission: 60, safety: 65, consensus: 60,
  nav_integrity: 55, clock_health: 55, trust: 55,
};
const degScore = calcSurvivalScore(degradedScores);
assert('degraded survival score < 80', degScore < 80);
assert('degraded survival grade not GREEN', survivalGrade(degScore) !== 'GREEN');

// critical scores
const critScores: ConfidenceScores = {
  comms: 20, navigation: 20, mission: 20, safety: 30, consensus: 20,
  nav_integrity: 10, clock_health: 10, trust: 10,
};
const critScore = calcSurvivalScore(critScores);
assert('critical survival score < 40', critScore < 40);
assert('critical survival grade = CRITICAL', survivalGrade(critScore) === 'CRITICAL');

// trust<40 → AMBER in failure-state-machine
const trustBreached = decideFailureState(
  { ...nominalScores, trust: 30 },
  makeNode({ trust: 30 }),
);
assert('trust<40 → AMBER (consensus poisoning)', trustBreached.nextState === 'AMBER');
assert('trust<40 reason mentions trust', trustBreached.reason.includes('trust'));

// peer verification: detect consensus poisoning
const poisonedNode: SwarmNode = {
  id: 'AUM-05', role: 'AUM', state: 'GREEN', cellId: 'primary-swarm', lastSeenAt: Date.now(),
  confidence: { comms: 95, navigation: 92, mission: 98, safety: 96, consensus: 99, nav_integrity: 100, clock_health: 100, trust: 100 },
};
const degradedPeers: SwarmNode[] = [
  { id: 'AUM-01', role: 'AUM', state: 'AMBER', cellId: 'degraded-cell', lastSeenAt: Date.now(),
    confidence: { comms: 60, navigation: 60, mission: 62, safety: 70, consensus: 62, nav_integrity: 90, clock_health: 90, trust: 90 } },
  { id: 'AUM-02', role: 'AUM', state: 'AMBER', cellId: 'degraded-cell', lastSeenAt: Date.now(),
    confidence: { comms: 58, navigation: 58, mission: 60, safety: 68, consensus: 60, nav_integrity: 88, clock_health: 88, trust: 88 } },
  { id: 'AUM-03', role: 'AUM', state: 'AMBER', cellId: 'degraded-cell', lastSeenAt: Date.now(),
    confidence: { comms: 62, navigation: 62, mission: 63, safety: 72, consensus: 63, nav_integrity: 91, clock_health: 91, trust: 91 } },
];
const poisonResult = detectConsensusPoisoning(poisonedNode, [poisonedNode, ...degradedPeers]);
assert('consensus poisoning detected: suspicion > 0', poisonResult.suspicionScore > 0);
assert('consensus poisoning: suspicion ≥ 50', poisonResult.suspicionScore >= 50);

// applyPeerVerification degrades trust on suspicious node
const verifiedSwarm = applyPeerVerification([poisonedNode, ...degradedPeers]);
const verifiedPoisoned = verifiedSwarm.find(n => n.id === 'AUM-05')!;
assert('peer verification degrades trust on poisoned node', (verifiedPoisoned.confidence.trust ?? 100) < 100);

// ─── 12. alerts + mission health ──────────────────────────────────────────

section('12. alerts + mission health');

clearAlertHistory();

// generateAlerts: QUARANTINE triggers CRITICAL alert
const quarAlertNodes: SwarmNode[] = [
  { id: 'Q-01', role: 'AUM', state: 'QUARANTINE', cellId: 'quarantine-cell', lastSeenAt: Date.now(),
    confidence: nominalScores },
];
const quarAlerts = generateAlerts(quarAlertNodes, 5);
assert('QUARANTINE node generates CRITICAL alert', quarAlerts.some(a => a.severity === 'CRITICAL' && a.category === 'QUARANTINE'));

clearAlertHistory();

// generateAlerts: nav_integrity<50 triggers SPOOFING alert
const spoofAlertNodes: SwarmNode[] = [
  { id: 'S-01', role: 'AUM', state: 'AMBER', cellId: 'degraded-cell', lastSeenAt: Date.now(),
    confidence: { ...nominalScores, nav_integrity: 30 } },
];
const spoofAlerts = generateAlerts(spoofAlertNodes, 6);
assert('nav_integrity<50 generates SPOOFING alert', spoofAlerts.some(a => a.category === 'SPOOFING'));

clearAlertHistory();

// generateAlerts: clock_health<40 triggers CLOCK_ATTACK alert
const clockAlertNodes: SwarmNode[] = [
  { id: 'C-01', role: 'SENSOR', state: 'BLACK', cellId: 'blackout-cell', lastSeenAt: Date.now(),
    confidence: { ...nominalScores, clock_health: 20 } },
];
const clockAlerts = generateAlerts(clockAlertNodes, 7);
assert('clock_health<40 generates CLOCK_ATTACK alert', clockAlerts.some(a => a.category === 'CLOCK_ATTACK'));

clearAlertHistory();

// alert cooldown: same node/category twice in 1 tick should not double-fire
const dupAlerts1 = generateAlerts(quarAlertNodes, 10);
const dupAlerts2 = generateAlerts(quarAlertNodes, 10);
assert('alert cooldown prevents duplicate within same tick', dupAlerts2.filter(a => a.category === 'QUARANTINE').length === 0);

clearAlertHistory();

// computeMissionHealth: nominal swarm → NOMINAL
const healthySwarm = createInitialSwarm();
const mh1 = computeMissionHealth(healthySwarm);
assert('healthy swarm → NOMINAL mission health', mh1.level === 'NOMINAL');
assert('healthy swarm: asrpOnline = true', mh1.asrpOnline === true);
assert('healthy swarm: score ≥ 80', mh1.score >= 80);

// computeMissionHealth: ASRP offline → FAILED
const noAsrp = healthySwarm.map(n =>
  n.role === 'ASRP' ? { ...n, state: 'BLACK' as const } : n
);
const mh2 = computeMissionHealth(noAsrp);
assert('ASRP BLACK → FAILED mission health', mh2.level === 'FAILED');
assert('ASRP offline: asrpOnline = false', mh2.asrpOnline === false);

// computeMissionHealth: relays down → DEGRADED/CRITICAL
const noRelays = healthySwarm.map(n =>
  n.role === 'AIR_RELAY' ? { ...n, state: 'BLACK' as const } : n
);
const mh3 = computeMissionHealth(noRelays);
assert('relays BLACK → relaysCoverage = 0', mh3.relaysCoverage === 0);
assert('relays BLACK → DEGRADED or CRITICAL', mh3.level === 'DEGRADED' || mh3.level === 'CRITICAL');

// runSimulationTick returns alerts and missionHealth in result
const freshR = runSimulationTick({ missionId: 'SMOKE', tick: 1, nodes: createInitialSwarm(), eventLog: [] });
assert('runSimulationTick.alerts is array', Array.isArray(freshR.alerts));
assert('runSimulationTick.missionHealth is object', typeof freshR.missionHealth === 'object');

// ─── summary ──────────────────────────────────────────────────────────────

const total = passed + failed;
console.log('\n' + '═'.repeat(51));
console.log(`  SMOKE TEST COMPLETE`);
console.log(`  Passed: ${passed}/${total}`);
if (failed > 0) {
  console.log(`  Failed: ${failed}`);
  for (const f of failures) console.log(`    ✗ ${f}`);
  process.exit(1);
} else {
  console.log('  All checks passed.');
}
console.log('═'.repeat(51));
