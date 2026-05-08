import { useState } from 'react';
import { Link } from 'wouter';
import { Brain, Search, ChevronRight, CheckCircle2, Clock, AlertCircle, TrendingUp, FileText, Shield, Calendar, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ── Stat Cards ──────────────────────────────────────────────────────────────

const statCards = [
  {
    label: 'Contracts Analysed',
    value: '147',
    sub: '+8 this week',
    icon: FileText,
    accent: '#00D4FF',
  },
  {
    label: 'Risk Flags',
    value: '23',
    sub: '4 high priority',
    icon: AlertCircle,
    accent: '#EF4444',
  },
  {
    label: 'Obligations Tracked',
    value: '312',
    sub: '14 due this month',
    icon: Shield,
    accent: '#7C3AED',
  },
  {
    label: 'Expiring Soon',
    value: '4',
    sub: 'Within 90 days',
    icon: Calendar,
    accent: '#F59E0B',
  },
];

// ── Risk Distribution ────────────────────────────────────────────────────────

const riskData = [
  { label: 'High Risk', count: 4, pct: 17, color: '#EF4444' },
  { label: 'Medium Risk', count: 11, pct: 48, color: '#F59E0B' },
  { label: 'Low Risk', count: 8, pct: 35, color: '#22C55E' },
];

// conic-gradient stop from cumulative percentages
function buildConic(segments: { pct: number; color: string }[]) {
  let cursor = 0;
  return segments
    .map(({ pct, color }) => {
      const start = cursor;
      cursor += pct;
      return `${color} ${start}% ${cursor}%`;
    })
    .join(', ');
}

// ── Recent Analyses ──────────────────────────────────────────────────────────

const analyses = [
  { name: 'Services_Agreement_v3_FINAL.pdf', risk: 'High', score: 73, when: '2h ago' },
  { name: 'NDA_Harrington_Partners.docx', risk: 'Low', score: 18, when: '5h ago' },
  { name: 'SaaS_Licence_Meridian.pdf', risk: 'Medium', score: 51, when: 'Yesterday' },
  { name: 'Employment_Contract_Senior.docx', risk: 'Low', score: 12, when: '2 days' },
  { name: 'Consultancy_Agreement_v2.pdf', risk: 'Medium', score: 44, when: '3 days' },
  { name: 'Supply_Chain_Agreement.pdf', risk: 'High', score: 81, when: '1 week' },
];

function scoreColor(score: number) {
  if (score > 60) return '#EF4444';
  if (score >= 30) return '#F59E0B';
  return '#22C55E';
}

function riskBadgeClass(risk: string) {
  if (risk === 'High') return 'border-red-500/40 bg-red-500/10 text-red-400';
  if (risk === 'Medium') return 'border-amber-500/40 bg-amber-500/10 text-amber-400';
  return 'border-green-500/40 bg-green-500/10 text-green-400';
}

// ── AI Queue + Obligations ───────────────────────────────────────────────────

const queue = [
  { name: 'NDA_Blackwood.pdf', status: 'done' },
  { name: 'Frame_Agreement_Pemberton.pdf', status: 'processing' },
  { name: 'Lease_Agreement_2026.pdf', status: 'queued' },
  { name: 'Partnership_Deed_v4.pdf', status: 'queued' },
];

const obligations = [
  { text: 'Payment: £45,000 to Meridian', due: '30 May', urgency: 'red' },
  { text: 'Report: Q1 compliance report', due: '1 Jun', urgency: 'red' },
  { text: 'Renewal: Harrington NDA', due: '14 Jun', urgency: 'amber' },
  { text: 'Notice: Termination window closes', due: '20 Jun', urgency: 'amber' },
  { text: 'Review: Annual SLA review', due: '30 Jun', urgency: 'green' },
];

function urgencyDot(u: string) {
  if (u === 'red') return 'bg-red-500';
  if (u === 'amber') return 'bg-amber-400';
  return 'bg-green-500';
}

// ── Expiry Timeline ──────────────────────────────────────────────────────────

const months = [
  { label: 'Jan', count: 0 },
  { label: 'Feb', count: 1 },
  { label: 'Mar', count: 1 },
  { label: 'Apr', count: 0 },
  { label: 'May', count: 2 },
  { label: 'Jun', count: 3 },
  { label: 'Jul', count: 1 },
  { label: 'Aug', count: 4 },
  { label: 'Sep', count: 0 },
  { label: 'Oct', count: 0 },
  { label: 'Nov', count: 2 },
  { label: 'Dec', count: 1 },
];

const maxCount = Math.max(...months.map((m) => m.count));

// ── Suggested queries ────────────────────────────────────────────────────────

const suggestions = [
  'Show all high-risk contracts',
  'Contracts expiring this quarter',
  'Uncapped liability clauses',
  'Auto-renewal deadlines',
];

// ── Nav tabs ─────────────────────────────────────────────────────────────────

const navTabs = ['Dashboard', 'Contracts', 'Obligations', 'Risk Register', 'Settings'];

// ── Component ────────────────────────────────────────────────────────────────

export default function UltAiDashboard() {
  const [query, setQuery] = useState('');
  const [activeTab] = useState('Dashboard');

  const conicGradient = buildConic(riskData);

  return (
    <div className="min-h-screen bg-[#0B0C10] text-white">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B0C10]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00D4FF]/10">
              <Brain className="h-5 w-5 text-[#00D4FF]" />
            </div>
            <span className="text-lg font-bold tracking-tight">UltAi</span>
          </div>

          {/* Nav tabs */}
          <nav className="flex items-center gap-1">
            {navTabs.map((tab) => (
              <button
                key={tab}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                  tab === activeTab
                    ? 'bg-[#00D4FF]/10 text-[#00D4FF]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          {/* User avatar */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7C3AED] text-xs font-bold">
            AC
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {/* ── Page title ── */}
        <div>
          <h1 className="text-2xl font-bold">Contract Intelligence Dashboard</h1>
          <p className="mt-1 text-sm text-gray-400">AI-powered contract analysis and risk monitoring</p>
        </div>

        {/* ── Row 1: Stat Cards ── */}
        <div className="grid grid-cols-4 gap-4">
          {statCards.map(({ label, value, sub, icon: Icon, accent }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
              style={{ borderTop: `2px solid ${accent}` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{label}</p>
                  <p className="mt-2 text-3xl font-bold" style={{ color: accent }}>
                    {value}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">{sub}</p>
                </div>
                <div className="rounded-lg p-2" style={{ background: `${accent}15` }}>
                  <Icon className="h-5 w-5" style={{ color: accent }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Row 2: Three-column section ── */}
        <div className="grid grid-cols-[35%_35%_30%] gap-4">
          {/* Left: Risk Donut */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-4 text-sm font-semibold text-gray-300">Risk Distribution</h2>

            {/* Donut */}
            <div className="flex flex-col items-center">
              <div className="relative flex h-40 w-40 items-center justify-center">
                {/* Outer conic-gradient ring */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(${conicGradient})`,
                  }}
                />
                {/* Inner hole */}
                <div className="relative z-10 flex h-24 w-24 flex-col items-center justify-center rounded-full bg-[#0B0C10]">
                  <span className="text-2xl font-bold text-white">23</span>
                  <span className="text-[10px] text-gray-400">flags</span>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-5 w-full space-y-2">
                {riskData.map(({ label, count, pct, color }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ background: color }}
                      />
                      <span className="text-gray-300">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">{count}</span>
                      <span className="w-8 text-right text-xs text-gray-500">{pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Middle: Recent Analyses */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-4 text-sm font-semibold text-gray-300">Recent Contract Analyses</h2>
            <div className="space-y-3">
              {analyses.map(({ name, risk, score, when }) => (
                <div key={name} className="group cursor-pointer rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.05]">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-white">{name}</p>
                      <p className="mt-0.5 text-[10px] text-gray-500">{when}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge className={`text-[10px] px-1.5 py-0 ${riskBadgeClass(risk)}`}>
                        {risk}
                      </Badge>
                      <span className="text-xs font-semibold" style={{ color: scoreColor(score) }}>
                        {score}/100
                      </span>
                    </div>
                  </div>
                  {/* Score bar */}
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${score}%`,
                        background: scoreColor(score),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: AI Queue + Obligations */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-5">
            {/* Processing Queue */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Brain className="h-4 w-4 text-[#7C3AED]" />
                <h2 className="text-sm font-semibold text-gray-300">AI Processing Queue</h2>
              </div>
              <div className="space-y-2">
                {queue.map(({ name, status }) => (
                  <div key={name} className="flex items-center gap-2.5 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                    {status === 'done' && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-400" />}
                    {status === 'processing' && (
                      <span className="relative flex h-3 w-3 shrink-0 items-center justify-center">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00D4FF] opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00D4FF]" />
                      </span>
                    )}
                    {status === 'queued' && <Clock className="h-3.5 w-3.5 shrink-0 text-gray-500" />}
                    <p className="min-w-0 truncate text-xs text-gray-300">{name}</p>
                    <span
                      className={`ml-auto shrink-0 text-[10px] ${
                        status === 'done'
                          ? 'text-green-400'
                          : status === 'processing'
                          ? 'text-[#00D4FF]'
                          : 'text-gray-500'
                      }`}
                    >
                      {status === 'done' ? 'Complete' : status === 'processing' ? 'Processing' : 'Queued'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Obligations due */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Bell className="h-4 w-4 text-[#00D4FF]" />
                <h2 className="text-sm font-semibold text-gray-300">Obligations due this month</h2>
              </div>
              <div className="space-y-2">
                {obligations.map(({ text, due, urgency }) => (
                  <div key={text} className="flex items-start gap-2.5 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                    <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${urgencyDot(urgency)}`} />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-300 leading-snug">{text}</p>
                      <p className="mt-0.5 text-[10px] text-gray-500">Due {due}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 3: Expiry Timeline ── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#00D4FF]" />
              <h2 className="text-sm font-semibold text-gray-300">Contract Expiry Timeline — Next 12 Months</h2>
            </div>
            <span className="text-xs text-gray-500">15 contracts tracked</span>
          </div>

          <div className="flex items-end gap-2 overflow-x-auto pb-2">
            {months.map(({ label, count }) => {
              const heightPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
              const barH = Math.round(heightPct * 0.8); // max ~80px scale
              return (
                <div key={label} className="flex min-w-[52px] flex-1 flex-col items-center gap-1">
                  {/* Bar + count label */}
                  <div className="relative flex w-full items-end justify-center" style={{ height: '80px' }}>
                    {count > 0 ? (
                      <div
                        className="w-4/5 rounded-t-sm bg-[#00D4FF]/70 transition-all hover:bg-[#00D4FF]"
                        style={{ height: `${barH}px` }}
                      >
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-[#00D4FF]">
                          {count}
                        </span>
                      </div>
                    ) : (
                      <div className="w-4/5 rounded-t-sm border border-dashed border-white/10" style={{ height: '4px' }} />
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Row 4: Natural Language Search ── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-3 flex items-center gap-2">
            <Brain className="h-4 w-4 text-[#7C3AED]" />
            <h2 className="text-sm font-semibold text-gray-300">Ask UltAi</h2>
          </div>

          {/* Search bar */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Ask UltAi: "Which contracts expire in the next 90 days?"'
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-[#00D4FF]/50 focus:ring-1 focus:ring-[#00D4FF]/30"
              />
            </div>
            <Button className="shrink-0 rounded-xl bg-[#00D4FF] px-5 text-sm font-semibold text-black hover:bg-[#00bce8]">
              Ask AI
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          {/* Suggestion pills */}
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-gray-400 transition-colors hover:border-[#00D4FF]/30 hover:bg-[#00D4FF]/5 hover:text-[#00D4FF]"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
