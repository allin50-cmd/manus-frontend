import { useState, useEffect, useCallback } from 'react';
import MainNav from '@/components/MainNav';
import { Helmet } from 'react-helmet-async';

type PIEMode = 'healthy' | 'degraded' | 'critical' | 'failsafe';

interface PIEState {
  mode: PIEMode;
  confidence: number;
  ruleName: string;
  computedAt: string;
}

interface OpsSummary {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  concurrency: number;
}

const MODE_CONFIG: Record<PIEMode, { label: string; color: string; bg: string; border: string; dot: string }> = {
  healthy:  { label: 'HEALTHY',  color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', dot: 'bg-emerald-400' },
  degraded: { label: 'DEGRADED', color: 'text-yellow-400',  bg: 'bg-yellow-400/10',  border: 'border-yellow-400/30',  dot: 'bg-yellow-400' },
  critical: { label: 'CRITICAL', color: 'text-orange-400',  bg: 'bg-orange-400/10',  border: 'border-orange-400/30',  dot: 'bg-orange-400' },
  failsafe: { label: 'FAILSAFE', color: 'text-red-400',     bg: 'bg-red-400/10',     border: 'border-red-400/30',     dot: 'bg-red-400' },
};

const CONCURRENCY_MAP: Record<PIEMode, number> = {
  healthy: 20, degraded: 10, critical: 3, failsafe: 1,
};

const PIE_RULES = [
  { id: 1, rule: 'extreme-error-rate',       target: 'failsafe', condition: 'errorRate > 20%' },
  { id: 2, rule: 'sustained-high-errors',    target: 'failsafe', condition: 'last 5 modes non-healthy & errorRate > 8%' },
  { id: 3, rule: 'dual-transport-failure',   target: 'failsafe', condition: 'queueDepth > 90% & errorRate > 15%' },
  { id: 4, rule: 'high-error-rate',          target: 'critical', condition: 'errorRate > 10%' },
  { id: 5, rule: 'deep-queue-with-errors',   target: 'critical', condition: 'queueDepth > 70% & errorRate > 5%' },
  { id: 6, rule: 'low-ultai-confidence',     target: 'critical', condition: 'avgConfidence < 50% & errorRate > 3%' },
  { id: 7, rule: 'moderate-error-rate',      target: 'degraded', condition: 'errorRate > 3%' },
  { id: 8, rule: 'high-queue-depth',         target: 'degraded', condition: 'queueDepth > 50%' },
  { id: 9, rule: 'tenant-concentration-risk',target: 'degraded', condition: 'tenantConcentration > 90% & errorRate > 1%' },
  { id: 10, rule: 'mode-instability',        target: 'degraded', condition: '≥3 distinct modes in last 10 & errorRate > 1%' },
  { id: 11, rule: 'all-clear',               target: 'healthy',  condition: 'none of the above triggered' },
];

const TARGET_CONFIG: Record<string, string> = {
  failsafe: 'text-red-400',
  critical: 'text-orange-400',
  degraded: 'text-yellow-400',
  healthy: 'text-emerald-400',
};

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

export default function PIEDashboard() {
  const [state, setState] = useState<PIEState | null>(null);
  const [ops, setOps] = useState<OpsSummary | null>(null);
  const [history, setHistory] = useState<PIEMode[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchAll = useCallback(async () => {
    try {
      const [stateRes, opsRes, histRes] = await Promise.all([
        fetch('/api/pie/health'),
        fetch('/api/ops/summary'),
        fetch('/api/pie/history'),
      ]);
      if (stateRes.ok) setState(await stateRes.json());
      if (opsRes.ok) setOps(await opsRes.json());
      if (histRes.ok) {
        const d = await histRes.json();
        setHistory(Array.isArray(d.history) ? d.history : []);
      }
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 10_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const mode: PIEMode = state?.mode ?? 'healthy';
  const cfg = MODE_CONFIG[mode];

  return (
    <>
      <Helmet>
        <title>PIE Control Plane — Allin50</title>
        <meta name="description" content="Policy & Integration Engine system health dashboard" />
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="min-h-screen bg-[#0F1014] text-white">
        <MainNav active="PIE" />

        <main id="main-content" className="mx-auto max-w-7xl px-6 py-10 space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">PIE Control Plane</h1>
              <p className="mt-1 text-sm text-gray-500">Policy &amp; Integration Engine — real-time system health</p>
            </div>
            <button
              onClick={fetchAll}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 rounded-full border-2 border-[#5A4BFF] border-t-transparent animate-spin" />
            </div>
          ) : (
            <>
              {/* Mode card */}
              <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-6`}>
                <div className="flex items-center gap-3">
                  <span className={`h-3 w-3 rounded-full ${cfg.dot} animate-pulse`} />
                  <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">System Mode</span>
                </div>
                <div className="mt-3 flex flex-wrap items-end gap-6">
                  <span className={`text-5xl font-black tracking-tight ${cfg.color}`}>{cfg.label}</span>
                  <div className="space-y-0.5">
                    <p className="text-sm text-gray-400">Rule: <span className="font-mono text-white">{state?.ruleName ?? '—'}</span></p>
                    <p className="text-sm text-gray-400">Confidence: <span className="text-white">{state ? Math.round(state.confidence * 100) : '—'}%</span></p>
                    <p className="text-sm text-gray-400">Concurrency cap: <span className="text-white">{CONCURRENCY_MAP[mode]}</span></p>
                    <p className="text-xs text-gray-600">Updated: {lastRefresh.toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>

              {/* Queue metrics */}
              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Queue Metrics</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatCard label="Waiting" value={ops?.waiting ?? 0} sub="jobs pending" />
                  <StatCard label="Active" value={ops?.active ?? 0} sub="running now" />
                  <StatCard label="Completed" value={ops?.completed ?? 0} sub="last 24h" />
                  <StatCard label="Failed" value={ops?.failed ?? 0} sub="last 24h" />
                </div>
              </div>

              {/* Rules table */}
              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Policy Rules (priority order)</h2>
                <div className="overflow-hidden rounded-xl border border-white/10">
                  <table className="w-full text-sm">
                    <thead className="border-b border-white/10 bg-white/5">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">#</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Rule</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500 hidden sm:table-cell">Condition</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Target</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {PIE_RULES.map(r => {
                        const isActive = state?.ruleName === r.rule;
                        return (
                          <tr
                            key={r.id}
                            className={`transition-colors ${isActive ? cfg.bg : 'hover:bg-white/5'}`}
                          >
                            <td className="px-4 py-3 text-gray-600">{r.id}</td>
                            <td className="px-4 py-3 font-mono text-xs text-white">
                              {isActive && <span className={`mr-1.5 ${cfg.color}`}>▶</span>}
                              {r.rule}
                            </td>
                            <td className="px-4 py-3 text-gray-500 hidden sm:table-cell text-xs">{r.condition}</td>
                            <td className={`px-4 py-3 font-semibold ${TARGET_CONFIG[r.target]}`}>{r.target}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* History pills */}
              {history.length > 0 && (
                <div>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
                    Mode History (last {history.length})
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {history.slice(-30).map((m, i) => {
                      const mc = MODE_CONFIG[m];
                      return (
                        <span
                          key={i}
                          className={`rounded px-2 py-0.5 text-xs font-semibold ${mc.color} ${mc.bg} border ${mc.border}`}
                        >
                          {mc.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}
