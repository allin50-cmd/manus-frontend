import { useSwarm } from '@/contexts/SwarmContext';
import { useSyncQueue } from '@/contexts/SyncQueueContext';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useNetworkQuality } from '@/hooks/useNetworkQuality';
import { cacheRead, cacheWrite, formatCacheAge } from '@/lib/offlineCache';
import { syncAnalytics } from '@/lib/syncAnalytics';
import OfflineBanner from '@/components/OfflineBanner';
import { Button } from '@/components/ui/button';
import type { AgentSnapshot } from '@/lib/swarm/types';
import { useLocation } from 'wouter';
import {
  FileText, ArrowRight, Crown, Activity, Zap, Wifi, WifiOff,
  RotateCcw, X, Database, BarChart2, Clock,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const PHI_DOT: Record<string, string> = {
  green:  'bg-emerald-400',
  yellow: 'bg-amber-400',
  orange: 'bg-orange-500',
  red:    'bg-red-500',
};

const RAFT_BADGE: Record<string, string> = {
  Leader:    'bg-blue-500/20 text-blue-300',
  Candidate: 'bg-amber-500/20 text-amber-300',
  Follower:  'bg-white/10 text-white/40',
};

const QUALITY_COLOR: Record<string, string> = {
  excellent: 'text-emerald-400',
  good:      'text-cyan-400',
  fair:      'text-amber-400',
  poor:      'text-orange-400',
  offline:   'text-red-400',
};

function AgentRow({ snap, isKilled, onKill, onRevive }: {
  snap: AgentSnapshot;
  isKilled: boolean;
  onKill: () => void;
  onRevive: () => void;
}) {
  if (isKilled) {
    return (
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white/20" />
          <span className="text-xs font-mono text-white/30">{snap.agentId}</span>
          <span className="text-[10px] text-white/20 italic">offline</span>
        </div>
        <button
          onClick={onRevive}
          title="Revive agent"
          className="p-1 rounded text-emerald-400 hover:bg-emerald-400/10 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>
    );
  }

  const confPct = Math.round(snap.confidence * 100);
  const confColor = confPct >= 90 ? 'bg-emerald-500' : confPct >= 70 ? 'bg-amber-400' : 'bg-red-500';

  return (
    <div className="py-2 space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PHI_DOT[snap.phiStatus]}`} />
          <span className="text-xs font-mono text-white/80">{snap.agentId}</span>
          {snap.raftState === 'Leader' && <Crown className="w-3 h-3 text-blue-400" />}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${RAFT_BADGE[snap.raftState]}`}>
            {snap.raftState}
          </span>
          <button
            onClick={onKill}
            title="Simulate failure"
            className="p-0.5 rounded text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${confColor}`}
            style={{ width: `${confPct}%` }}
          />
        </div>
        <span className="text-[10px] text-white/40 tabular-nums w-7 text-right">{confPct}%</span>
      </div>
      <p className="text-[10px] text-white/30">
        φ {snap.phi.toFixed(2)} · term {snap.term} · tasks {snap.taskCount}
      </p>
    </div>
  );
}

function SwarmPanel() {
  const { snapshot, kill, revive, killedAgents } = useSwarm();
  const ALL_IDS = ['alpha', 'beta', 'gamma'];
  const confPct = Math.round(snapshot.swarmConfidence * 100);
  const overallOk = confPct >= 70;

  const rows = ALL_IDS.map((id) => ({
    id,
    snap: snapshot.agents.find((a) => a.agentId === id) ?? {
      agentId: id, phi: 0, phiStatus: 'green' as const,
      raftState: 'Follower' as const, term: 0, confidence: 0, taskCount: 0,
    },
    killed: killedAgents.includes(id),
  }));

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold text-white">Swarm Health</span>
        </div>
        <span className={`text-xs font-medium ${overallOk ? 'text-emerald-400' : 'text-amber-400'}`}>
          {overallOk ? 'Operational' : 'Degraded'}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-3 h-3 text-white/40 flex-shrink-0" />
        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              confPct >= 90 ? 'bg-emerald-500' : confPct >= 70 ? 'bg-amber-400' : 'bg-red-500'
            }`}
            style={{ width: `${confPct}%` }}
          />
        </div>
        <span className="text-xs text-white/50 tabular-nums">{confPct}%</span>
      </div>

      <div className="divide-y divide-white/5">
        {rows.map(({ id, snap, killed }) => (
          <AgentRow
            key={id}
            snap={snap}
            isKilled={killed}
            onKill={() => kill(id)}
            onRevive={() => revive(id)}
          />
        ))}
      </div>

      {snapshot.leaderId && (
        <p className="mt-2 text-[10px] text-white/30">
          Leader: <span className="font-mono text-blue-400">{snapshot.leaderId}</span>
          {' '}· tick {snapshot.tick}
        </p>
      )}
      {!snapshot.leaderId && snapshot.tick > 0 && (
        <p className="mt-2 text-[10px] text-amber-400">Electing leader…</p>
      )}
    </div>
  );
}

function NetworkPanel() {
  const online = useOnlineStatus();
  const { quality, latencyMs, packets } = useNetworkQuality();

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {online
            ? <Wifi className="w-4 h-4 text-cyan-400" />
            : <WifiOff className="w-4 h-4 text-red-400" />
          }
          <span className="text-sm font-semibold text-white">Network</span>
        </div>
        <span className={`text-xs font-medium ${QUALITY_COLOR[quality]}`}>
          {quality.charAt(0).toUpperCase() + quality.slice(1)}
        </span>
      </div>
      <div className="space-y-2.5">
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/40">Status</span>
          <span className={`text-xs font-mono font-medium ${online ? 'text-emerald-400' : 'text-red-400'}`}>
            {online ? 'Online' : 'Offline'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/40">Latency</span>
          <span className="text-xs font-mono text-white/70">
            {online && latencyMs > 0 ? `${latencyMs}ms` : '—'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/40">Probes sent</span>
          <span className="text-xs font-mono text-white/70">{packets}</span>
        </div>
      </div>
    </div>
  );
}

function SyncQueueSummary() {
  const { items } = useSyncQueue();
  const pending = items.filter((i) => !i.lastError).length;
  const failed = items.filter((i) => !!i.lastError).length;

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Database className="w-4 h-4 text-cyan-400" />
        <span className="text-sm font-semibold text-white">Sync Queue</span>
      </div>
      <div className="space-y-2.5">
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/40">Pending</span>
          <span className={`text-xs font-mono font-medium ${pending > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {pending}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/40">Failed</span>
          <span className={`text-xs font-mono font-medium ${failed > 0 ? 'text-red-400' : 'text-white/30'}`}>
            {failed}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/40">Total queued</span>
          <span className="text-xs font-mono text-white/70">{items.length}</span>
        </div>
      </div>
    </div>
  );
}

function AnalyticsPanel() {
  const [metrics, setMetrics] = useState(() => syncAnalytics.getMetrics());

  useEffect(() => {
    const interval = setInterval(() => setMetrics(syncAnalytics.getMetrics()), 2000);
    return () => clearInterval(interval);
  }, []);

  const rateColor = metrics.successRate >= 90
    ? 'text-emerald-400'
    : metrics.successRate >= 70
      ? 'text-amber-400'
      : 'text-red-400';

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart2 className="w-4 h-4 text-cyan-400" />
        <span className="text-sm font-semibold text-white">Analytics</span>
      </div>
      <div className="space-y-2.5">
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/40">Success rate</span>
          <span className={`text-xs font-mono font-medium ${rateColor}`}>
            {metrics.successRate.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/40">Avg attempts</span>
          <span className="text-xs font-mono text-white/70">
            {metrics.averageAttemptsPerItem.toFixed(1)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/40">Total synced</span>
          <span className="text-xs font-mono text-white/70">{metrics.totalSuccessful}</span>
        </div>
      </div>
    </div>
  );
}

function CacheBadge() {
  const cached = cacheRead<{ updatedAt: string }>('ultai:content');
  if (!cached) return null;
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300">
      <Clock className="w-3 h-3" />
      Cached · {formatCacheAge(cached.ageMs)}
    </div>
  );
}

export default function UltAi() {
  const [, setLocation] = useLocation();
  const online = useOnlineStatus();
  const { snapshot } = useSwarm();

  useEffect(() => {
    if (online) {
      cacheWrite('ultai:content', { updatedAt: new Date().toISOString() });
    }
  }, [online]);

  const confPct = Math.round(snapshot.swarmConfidence * 100);
  const swarmOk = confPct >= 70;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-[#1A1D28] to-[#0B0C10]">
      {!online && <OfflineBanner onRefresh={() => window.location.reload()} />}

      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <FileText className="w-16 h-16 text-cyan-400" />
          </div>
          <div className="flex items-center justify-center gap-3 mb-6 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-xs font-medium text-white/70">
              <span className={`w-1.5 h-1.5 rounded-full ${swarmOk ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              System {swarmOk ? 'Operational' : 'Degraded'} · {confPct}% confidence
            </div>
            <CacheBadge />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">UltAi Secure Intake</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            AI-powered secure client matter intake for law firms
          </p>
          <Button
            onClick={() => setLocation('/intake-sheet')}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-8 py-6 text-lg"
          >
            Try Intake Sheet
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* Swarm telemetry grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <SwarmPanel />
          <NetworkPanel />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SyncQueueSummary />
          <AnalyticsPanel />
        </div>
      </div>
    </div>
  );
}
