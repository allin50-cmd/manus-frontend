import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import MainNav from '@/components/MainNav';
import { Helmet } from 'react-helmet-async';

interface Stats {
  leads: number;
  intakeForms: number;
  complianceBundles: number;
  contacts: number;
}

interface PIEState {
  mode: 'healthy' | 'degraded' | 'critical' | 'failsafe';
  confidence: number;
  ruleName: string;
}

const MODE_DOT: Record<string, string> = {
  healthy: 'bg-emerald-400',
  degraded: 'bg-yellow-400',
  critical: 'bg-orange-400',
  failsafe: 'bg-red-400',
};

const MODE_TEXT: Record<string, string> = {
  healthy: 'text-emerald-400',
  degraded: 'text-yellow-400',
  critical: 'text-orange-400',
  failsafe: 'text-red-400',
};

const PRODUCTS = [
  {
    name: 'FineGuard',
    desc: 'Companies House compliance monitoring. Real-time alerts for filing deadlines, director changes and penalty risks.',
    href: '/fineguard',
    dot: 'bg-[#C9A64A]',
    accent: 'border-[#C9A64A]/30 hover:border-[#C9A64A]/60',
  },
  {
    name: 'VaultLine',
    desc: 'Secure legal document storage with end-to-end encryption, access trails and version history.',
    href: '/vaultline',
    dot: 'bg-[#5A4BFF]',
    accent: 'border-[#5A4BFF]/30 hover:border-[#5A4BFF]/60',
  },
  {
    name: 'UltAi',
    desc: 'AI-powered client intake and triage. Classifies matters, extracts key data and routes to the right team.',
    href: '/ultai',
    dot: 'bg-cyan-400',
    accent: 'border-cyan-400/30 hover:border-cyan-400/60',
  },
  {
    name: 'Legal Suite',
    desc: 'Chambers management platform: barristers, briefs, diary, clerks dashboard and billing pipeline.',
    href: '/legal',
    dot: 'bg-emerald-400',
    accent: 'border-emerald-400/30 hover:border-emerald-400/60',
  },
];

const TOOLS = [
  { name: 'Admin Panel',       href: '/admin',           icon: '🛠' },
  { name: 'Clerk Dashboard',   href: '/clerk-dashboard', icon: '⚖️' },
  { name: 'Intake Sheet',      href: '/intake',          icon: '📋' },
  { name: 'Audit Sign-up',     href: '/audit',           icon: '🔍' },
  { name: 'PIE Control Plane', href: '/pie',             icon: '🧠' },
  { name: 'Book a Demo',       href: '/book-demo',       icon: '📅' },
];

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="mt-0.5 text-xs text-gray-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}

export default function Portal() {
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [pie, setPie] = useState<PIEState | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    fetch('/api/pie/health', { signal })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setPie(d); })
      .catch(() => {});

    const STAT_SOURCES: { url: string; key: keyof Stats }[] = [
      { url: '/api/admin/leads?limit=1',               key: 'leads' },
      { url: '/api/admin/intake-forms?limit=1',         key: 'intakeForms' },
      { url: '/api/admin/compliance-bundles?limit=1',   key: 'complianceBundles' },
      { url: '/api/admin/contacts?limit=1',             key: 'contacts' },
    ];

    const defaults: Stats = { leads: 0, intakeForms: 0, complianceBundles: 0, contacts: 0 };

    STAT_SOURCES.forEach(({ url, key }) => {
      fetch(url, { signal })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.pagination) setStats(s => ({ ...(s ?? defaults), [key]: d.pagination.total })); })
        .catch(() => {});
    });

    return () => controller.abort();
  }, []);

  const mode = pie?.mode ?? 'healthy';

  return (
    <>
      <Helmet>
        <title>Portal — Allin50 Legal Suite</title>
        <meta name="description" content="Unified portal for the Allin50 Legal Suite platform" />
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="min-h-screen bg-[#0F1014] text-white">
        <MainNav active="Portal" />

        <main id="main-content" className="mx-auto max-w-7xl px-6 py-10 space-y-10">
          {/* Hero */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight">
                Allin<span className="text-[#C9A64A]">50</span> Portal
              </h1>
              <p className="mt-1 text-gray-400">Your unified legal tech control centre</p>
            </div>

            {/* PIE status badge */}
            {pie && (
              <button
                onClick={() => setLocation('/pie')}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm hover:bg-white/10 transition-colors"
              >
                <span className={`h-2 w-2 rounded-full ${MODE_DOT[mode]} animate-pulse`} />
                <span className="text-gray-400">PIE:</span>
                <span className={`font-semibold ${MODE_TEXT[mode]}`}>{mode.toUpperCase()}</span>
                <span className="text-gray-600 text-xs">({pie.ruleName})</span>
              </button>
            )}
          </div>

          {/* Live stats */}
          {stats && (
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Live Platform Data</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Leads" value={stats.leads} />
                <StatCard label="Intakes" value={stats.intakeForms} />
                <StatCard label="Compliance Bundles" value={stats.complianceBundles} />
                <StatCard label="Contacts" value={stats.contacts} />
              </div>
            </div>
          )}

          {/* Product cards */}
          <div>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PRODUCTS.map(p => (
                <button
                  key={p.name}
                  onClick={() => setLocation(p.href)}
                  className={`rounded-xl border bg-white/5 p-5 text-left transition-all hover:bg-white/10 ${p.accent}`}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${p.dot}`} />
                    <span className="font-semibold text-white">{p.name}</span>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Tools grid */}
          <div>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Platform Tools</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TOOLS.map(t => (
                <button
                  key={t.name}
                  onClick={() => setLocation(t.href)}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-left text-sm hover:bg-white/10 transition-colors"
                >
                  <span className="text-lg">{t.icon}</span>
                  <span className="font-medium text-white">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setLocation('/audit')}
              className="rounded-lg bg-[#C9A64A] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[#B8954A] transition-colors"
            >
              Free Compliance Audit →
            </button>
            <button
              onClick={() => setLocation('/book-demo')}
              className="rounded-lg border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Book Demo
            </button>
          </div>
        </main>
      </div>
    </>
  );
}
