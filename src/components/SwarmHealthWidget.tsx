import { useSwarm } from '@/contexts/SwarmContext';
import { Activity, Crown, ChevronDown, ChevronUp, Zap, RotateCcw, X } from 'lucide-react';
import { useState } from 'react';
import type { AgentSnapshot } from '@/lib/swarm/types';

const PHI_COLOUR: Record<string, string> = {
  green:  'bg-emerald-500',
  yellow: 'bg-amber-400',
  orange: 'bg-orange-500',
  red:    'bg-red-500',
};

const RAFT_BADGE: Record<string, string> = {
  Leader:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Candidate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Follower:  'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

function AgentRow({ snap, isKilled, onKill, onRevive }: {
  snap: AgentSnapshot;
  isKilled: boolean;
  onKill: () => void;
  onRevive: () => void;
}) {
  if (isKilled) {
    return (
      <div className="flex items-center justify-between gap-2 py-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 flex-shrink-0" />
          <span className="text-xs font-mono text-slate-400 dark:text-slate-500">{snap.agentId}</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">offline</span>
        </div>
        <button
          onClick={onRevive}
          title="Revive agent"
          className="p-0.5 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>
    );
  }

  const confPct = Math.round(snap.confidence * 100);
  const confColour = confPct >= 90 ? 'bg-emerald-500' : confPct >= 70 ? 'bg-amber-400' : 'bg-red-500';

  return (
    <div className="py-1.5 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PHI_COLOUR[snap.phiStatus]}`} />
          <span className="text-xs font-mono text-slate-700 dark:text-slate-300">{snap.agentId}</span>
          {snap.raftState === 'Leader' && (
            <Crown className="w-3 h-3 text-blue-500 flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${RAFT_BADGE[snap.raftState]}`}>
            {snap.raftState}
          </span>
          <button
            onClick={onKill}
            title="Simulate failure"
            className="p-0.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${confColour}`}
            style={{ width: `${confPct}%` }}
          />
        </div>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums w-7 text-right">
          {confPct}%
        </span>
      </div>

      {/* φ value */}
      <p className="text-[10px] text-slate-400 dark:text-slate-500">
        φ&nbsp;{snap.phi.toFixed(2)} · term&nbsp;{snap.term} · tasks&nbsp;{snap.taskCount}
      </p>
    </div>
  );
}

export default function SwarmHealthWidget() {
  const { snapshot, kill, revive, killedAgents } = useSwarm();
  const [open, setOpen] = useState(true);

  const ALL_IDS = ['alpha', 'beta', 'gamma'];
  const confPct = Math.round(snapshot.swarmConfidence * 100);
  const overallOk = confPct >= 70;

  // Build rows for all known agents, even killed ones
  const rows = ALL_IDS.map((id) => ({
    id,
    snap: snapshot.agents.find((a) => a.agentId === id) ?? {
      agentId: id, phi: 0, phiStatus: 'green' as const,
      raftState: 'Follower' as const, term: 0, confidence: 0, taskCount: 0,
    },
    killed: killedAgents.includes(id),
  }));

  return (
    <div className="mx-3 mt-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Swarm Health</span>
          <span className={`w-1.5 h-1.5 rounded-full ${overallOk ? 'bg-emerald-500' : 'bg-red-500'}`} />
        </div>
        {open ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
      </button>

      {open && (
        <div className="px-3 pb-3 border-t border-slate-100 dark:border-slate-800">
          {/* Swarm confidence bar */}
          <div className="flex items-center gap-2 pt-2 pb-1.5">
            <Zap className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${confPct >= 90 ? 'bg-emerald-500' : confPct >= 70 ? 'bg-amber-400' : 'bg-red-500'}`}
                style={{ width: `${confPct}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">{confPct}%</span>
          </div>

          {/* Agent rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
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
            <p className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500">
              Leader: <span className="font-mono text-blue-600 dark:text-blue-400">{snapshot.leaderId}</span>
              {' '}· tick&nbsp;{snapshot.tick}
            </p>
          )}
          {!snapshot.leaderId && snapshot.tick > 0 && (
            <p className="mt-1.5 text-[10px] text-amber-600 dark:text-amber-400">Electing leader…</p>
          )}
        </div>
      )}
    </div>
  );
}
