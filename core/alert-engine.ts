import { SwarmNode, FailureState } from './types';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface SwarmAlert {
  alertId: string;
  tick: number;
  severity: AlertSeverity;
  nodeId: string | null;
  message: string;
  category: 'STATE_CHANGE' | 'SPOOFING' | 'CLOCK_ATTACK' | 'QUARANTINE' | 'MISSION_HEALTH' | 'CONSENSUS_POISONING';
}

// Per-category cooldown: minimum ticks between repeated alerts for the same node+category
const COOLDOWN_TICKS: Record<SwarmAlert['category'], number> = {
  STATE_CHANGE: 4,
  SPOOFING: 3,
  CLOCK_ATTACK: 3,
  QUARANTINE: 5,
  MISSION_HEALTH: 5,
  CONSENSUS_POISONING: 3,
};

interface AlertKey { nodeId: string | null; category: SwarmAlert['category'] }
const lastAlertTick = new Map<string, number>();

function alertKey(k: AlertKey): string {
  return `${k.nodeId ?? '__swarm__'}:${k.category}`;
}

function canAlert(k: AlertKey, tick: number): boolean {
  const key = alertKey(k);
  const last = lastAlertTick.get(key) ?? -999;
  return tick - last >= COOLDOWN_TICKS[k.category];
}

function recordAlert(k: AlertKey, tick: number): void {
  lastAlertTick.set(alertKey(k), tick);
}

let alertCounter = 0;
function nextId(): string {
  return `ALT-${String(++alertCounter).padStart(4, '0')}`;
}

export function clearAlertHistory(): void {
  lastAlertTick.clear();
  alertCounter = 0;
}

export function generateAlerts(nodes: SwarmNode[], tick: number): SwarmAlert[] {
  const alerts: SwarmAlert[] = [];

  for (const node of nodes) {
    // QUARANTINE alerts
    if (node.state === 'QUARANTINE') {
      const k: AlertKey = { nodeId: node.id, category: 'QUARANTINE' };
      if (canAlert(k, tick)) {
        alerts.push({
          alertId: nextId(), tick, severity: 'CRITICAL', nodeId: node.id,
          message: `${node.id} QUARANTINED — operator clearance required`,
          category: 'QUARANTINE',
        });
        recordAlert(k, tick);
      }
    }

    // GNSS / spoofing alerts
    if (node.confidence.nav_integrity < 50) {
      const k: AlertKey = { nodeId: node.id, category: 'SPOOFING' };
      if (canAlert(k, tick)) {
        const severity: AlertSeverity = node.confidence.nav_integrity < 25 ? 'CRITICAL' : 'WARNING';
        alerts.push({
          alertId: nextId(), tick, severity, nodeId: node.id,
          message: `${node.id} nav_integrity=${node.confidence.nav_integrity} — possible GNSS spoofing`,
          category: 'SPOOFING',
        });
        recordAlert(k, tick);
      }
    }

    // Clock attack alerts
    if (node.confidence.clock_health < 40) {
      const k: AlertKey = { nodeId: node.id, category: 'CLOCK_ATTACK' };
      if (canAlert(k, tick)) {
        const severity: AlertSeverity = node.confidence.clock_health < 15 ? 'CRITICAL' : 'WARNING';
        alerts.push({
          alertId: nextId(), tick, severity, nodeId: node.id,
          message: `${node.id} clock_health=${node.confidence.clock_health} — timing attack / sync loss`,
          category: 'CLOCK_ATTACK',
        });
        recordAlert(k, tick);
      }
    }

    // Consensus poisoning via trust score
    if (node.confidence.trust < 50) {
      const k: AlertKey = { nodeId: node.id, category: 'CONSENSUS_POISONING' };
      if (canAlert(k, tick)) {
        alerts.push({
          alertId: nextId(), tick, severity: 'WARNING', nodeId: node.id,
          message: `${node.id} trust=${node.confidence.trust} — consensus poisoning suspected`,
          category: 'CONSENSUS_POISONING',
        });
        recordAlert(k, tick);
      }
    }

    // General state change to RED or BLACK
    const badStates: FailureState[] = ['RED', 'BLACK'];
    if (badStates.includes(node.state)) {
      const k: AlertKey = { nodeId: node.id, category: 'STATE_CHANGE' };
      if (canAlert(k, tick)) {
        alerts.push({
          alertId: nextId(), tick, severity: 'WARNING', nodeId: node.id,
          message: `${node.id} entered ${node.state} state`,
          category: 'STATE_CHANGE',
        });
        recordAlert(k, tick);
      }
    }
  }

  return alerts;
}
