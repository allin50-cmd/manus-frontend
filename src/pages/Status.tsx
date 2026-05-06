import { useSwarm } from '@/contexts/SwarmContext';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { cacheRead } from '@/lib/offlineCache';
import { Activity, Wifi, WifiOff, Database, AlertCircle, CheckCircle2, Clock, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

type CacheEntry = { key: string; size: number; age: string };

export default function Status() {
  const { snapshot } = useSwarm();
  const online = useOnlineStatus();
  const [cacheEntries, setCacheEntries] = useState<CacheEntry[]>([]);

  useEffect(() => {
    const keys = ['dashboard.stats', 'cases.list.all', 'hearings.list', 'allocations.pending', 'docs.case.*', 'diary.*', 'cases.list.open', 'cases.list.in_progress', 'cases.list.closed', 'cases.list.on_hold'];
    const entries: CacheEntry[] = [];
    keys.forEach((k) => {
      const entry = cacheRead<any>(k);
      if (entry) {
        entries.push({
          key: k,
          size: JSON.stringify(entry.data).length,
          age: `${Math.round(entry.ageMs / 1000)}s`,
        });
      }
    });
    setCacheEntries(entries);
  }, []);

  const pct = Math.round(snapshot.swarmConfidence * 100);
  const totalCacheSize = cacheEntries.reduce((sum, e) => sum + e.size, 0);
  const cacheHealthy = cacheEntries.length >= 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">System Status</h1>
          <p className="text-slate-400">Real-time health dashboard for ClerkOS</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-sm font-medium">NETWORK</span>
              {online ? <Wifi className="w-5 h-5 text-emerald-400" /> : <WifiOff className="w-5 h-5 text-amber-400" />}
            </div>
            <div className="text-3xl font-bold text-white">{online ? 'Online' : 'Offline'}</div>
            <p className="text-slate-500 text-sm mt-2">{online ? 'All systems operational' : 'Operating in degraded mode'}</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-sm font-medium">SWARM CONFIDENCE</span>
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-3xl font-bold text-white">{pct}%</div>
            <div className="mt-3 bg-slate-900 rounded-full h-2">
              <div className={`h-full rounded-full transition-all ${pct >= 70 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-sm font-medium">CACHE</span>
              <Database className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-white">{cacheEntries.length}</div>
            <p className="text-slate-500 text-sm mt-2">{(totalCacheSize / 1024).toFixed(1)} KB cached</p>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Swarm Agents
          </h2>
          <div className="space-y-3">
            {snapshot.agents.map((agent) => (
              <div key={agent.agentId} className="bg-slate-900/50 border border-slate-700 rounded p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${agent.phiStatus === 'green' ? 'bg-emerald-500' : agent.phiStatus === 'yellow' ? 'bg-yellow-500' : agent.phiStatus === 'orange' ? 'bg-orange-500' : 'bg-red-500'}`} />
                    <span className="font-mono font-bold text-white">{agent.agentId}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${agent.raftState === 'Leader' ? 'bg-purple-500/30 text-purple-200' : 'bg-slate-700 text-slate-300'}`}>
                      {agent.raftState}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono text-slate-400">φ = {agent.phi.toFixed(2)}</div>
                    <div className="text-xs text-slate-500">term {agent.term}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="text-xs text-slate-500 mb-1">Confidence</div>
                    <div className="bg-slate-900 rounded-full h-2">
                      <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${Math.round(agent.confidence * 100)}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono text-cyan-400">{Math.round(agent.confidence * 100)}%</div>
                    <div className="text-xs text-slate-500">{agent.taskCount} tasks</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-400" />
              Cache Contents
            </h2>
            {cacheEntries.length > 0 ? (
              <div className="space-y-2">
                {cacheEntries.map((e) => (
                  <div key={e.key} className="flex items-center justify-between bg-slate-900/50 p-3 rounded border border-slate-700">
                    <div>
                      <div className="text-sm font-mono text-slate-300">{e.key}</div>
                      <div className="text-xs text-slate-500">{(e.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {e.age}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-400 text-sm">No cache entries. Navigate to pages to populate cache.</div>
            )}
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              System Health
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {online ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-amber-500" />}
                <span className="text-sm text-slate-300">Network: {online ? 'Online' : 'Offline'}</span>
              </div>
              <div className="flex items-center gap-2">
                {pct >= 70 ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-amber-500" />}
                <span className="text-sm text-slate-300">Swarm Confidence: {pct >= 70 ? 'Healthy' : 'Degraded'}</span>
              </div>
              <div className="flex items-center gap-2">
                {cacheHealthy ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-amber-500" />}
                <span className="text-sm text-slate-300">Cache: {cacheHealthy ? 'Populated' : 'Minimal'}</span>
              </div>
              <div className="flex items-center gap-2">
                {snapshot.agents.every((a) => a.phiStatus === 'green') ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-amber-500" />}
                <span className="text-sm text-slate-300">All Agents: {snapshot.agents.every((a) => a.phiStatus === 'green') ? 'Healthy' : 'Monitor'}</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-slate-900/50 border border-slate-700 rounded">
              <div className="text-xs text-slate-400">
                <div>Tick: {snapshot.tick}</div>
                <div>Leader Election: {snapshot.agents.filter((a) => a.raftState === 'Leader').length > 0 ? 'Stable' : 'In Progress'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-slate-500 text-center">
            Status updates in real-time. Swarm snapshot refreshes every 600ms. Phi accrual thresholds: green &lt;1 · yellow &lt;4 · orange &lt;8 · red ≥8
          </p>
        </div>
      </div>
    </div>
  );
}
