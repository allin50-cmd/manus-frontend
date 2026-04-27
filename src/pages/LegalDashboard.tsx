import ClerkOSLayout from '@/components/layout/ClerkOSLayout';
import { trpc } from '@/lib/trpc';
import {
  Fingerprint,
  Scale,
  Gavel,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'wouter';

// ─── Fingerprint identity badge ───────────────────────────────────────────────

function FingerprintBadge() {
  return (
    <div className="relative flex items-center justify-center w-12 h-12">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 opacity-20 animate-pulse" />
      <div className="relative z-10 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg">
        <Fingerprint className="w-5 h-5 text-white" />
      </div>
    </div>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded ${className}`} />;
}

const STATUS_BADGE: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  on_hold: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  closed: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  scheduled: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  completed: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'blue',
  loading = false,
}: {
  label: string;
  value: number | string;
  icon: React.FC<{ className?: string }>;
  accent?: 'blue' | 'violet' | 'amber' | 'emerald' | 'rose';
  loading?: boolean;
}) {
  const colours: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    violet: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    rose: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400',
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            {label}
          </p>
          {loading ? (
            <Skeleton className="h-8 w-16 mt-2" />
          ) : (
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">{value}</p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colours[accent]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LegalDashboard() {
  const { data: stats, isLoading, error } = trpc.dashboard.stats.useQuery(undefined, {
    retry: false,
    refetchInterval: 60_000,
  });

  const activeCases = stats?.activeCases ?? 0;
  const pendingHearings = stats?.pendingHearings ?? 0;
  const totalCases = stats?.totalCases ?? 0;
  const closedCases = stats?.closedCases ?? 0;

  return (
    <ClerkOSLayout>
      <div className="p-6 max-w-7xl mx-auto">

        {/* Header with identity badge */}
        <div className="mb-7 flex items-start gap-4">
          <FingerprintBadge />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Legal Dashboard
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              SuperLawClerk OS · Practitioner view
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-full">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              Verified session
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Database not connected — running in preview mode.
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Cases" value={totalCases} icon={Scale} accent="blue" loading={isLoading} />
          <StatCard label="Active" value={activeCases} icon={Clock} accent="amber" loading={isLoading} />
          <StatCard label="Hearings" value={pendingHearings} icon={Gavel} accent="violet" loading={isLoading} />
          <StatCard label="Closed" value={closedCases} icon={CheckCircle2} accent="emerald" loading={isLoading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active cases */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Active Cases
                </h2>
              </div>
              <Link
                href="/cases"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="px-5 py-3 flex items-center gap-4">
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                ))
              ) : !stats?.recentCases?.length ? (
                <p className="px-5 py-8 text-sm text-center text-slate-400">No cases yet</p>
              ) : (
                stats.recentCases.map((c) => (
                  <Link
                    key={c.id}
                    href="/cases"
                    className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {c.title}
                      </p>
                      <p className="text-xs text-slate-400 font-mono">{c.referenceNumber}</p>
                    </div>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_BADGE[c.status] ?? ''}`}
                    >
                      {c.status.replace('_', ' ')}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Upcoming hearings */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gavel className="w-4 h-4 text-violet-500" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Upcoming Hearings
                </h2>
              </div>
              <Link
                href="/hearings"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="px-5 py-3 flex items-center gap-4">
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                ))
              ) : !stats?.upcomingHearings?.length ? (
                <p className="px-5 py-8 text-sm text-center text-slate-400">No upcoming hearings</p>
              ) : (
                stats.upcomingHearings.map((h) => {
                  const isToday = h.hearingDate === new Date().toISOString().split('T')[0];
                  return (
                    <Link
                      key={h.id}
                      href="/hearings"
                      className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                            {h.courtroom}
                          </p>
                          {isToday && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white">TODAY</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          {h.hearingDate} · {h.hearingTime} · {h.judge}
                        </p>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_BADGE[h.status] ?? ''}`}>
                        {h.status}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Case Files', href: '/cases', icon: Scale, colour: 'bg-blue-600 hover:bg-blue-700' },
            { label: 'Hearings', href: '/hearings', icon: Gavel, colour: 'bg-violet-600 hover:bg-violet-700' },
            { label: 'Documents', href: '/documents', icon: FileText, colour: 'bg-emerald-600 hover:bg-emerald-700' },
            { label: 'Diary', href: '/diary', icon: Clock, colour: 'bg-amber-600 hover:bg-amber-700' },
          ].map(({ label, href, icon: Icon, colour }) => (
            <Link
              key={label}
              href={href}
              className={`${colour} text-white text-sm font-medium px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </ClerkOSLayout>
  );
}
