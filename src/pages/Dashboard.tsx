import ClerkOSLayout from '@/components/layout/ClerkOSLayout';
import { trpc } from '@/lib/trpc';
import { Scale, Gavel, ListTodo, TrendingUp, AlertCircle, XCircle, CalendarCheck, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded ${className}`} />
  );
}

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
  accent?: 'blue' | 'emerald' | 'amber' | 'violet' | 'slate' | 'rose';
  loading?: boolean;
}) {
  const colours: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    violet: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400',
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
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

const STATUS_BADGE: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  closed: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  on_hold: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  scheduled: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  completed: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

export default function Dashboard() {
  const { data: stats, isLoading, error } = trpc.dashboard.stats.useQuery(undefined, {
    retry: false,
    refetchInterval: 30_000,
  });

  return (
    <ClerkOSLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Court Clerk Management — live overview
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Database not connected — running in preview mode with empty data.
            </p>
          </div>
        )}

        {/* Stat grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <StatCard label="Total Cases" value={stats?.totalCases ?? 0} icon={Scale} accent="blue" loading={isLoading} />
          <StatCard label="Active" value={stats?.activeCases ?? 0} icon={TrendingUp} accent="emerald" loading={isLoading} />
          <StatCard label="Closed" value={stats?.closedCases ?? 0} icon={XCircle} accent="slate" loading={isLoading} />
          <StatCard label="Hearings" value={stats?.pendingHearings ?? 0} icon={Gavel} accent="amber" loading={isLoading} />
          <StatCard label="Today" value={stats?.todayHearings ?? 0} icon={CalendarCheck} accent="violet" loading={isLoading} />
          <StatCard label="Queue" value={stats?.pendingAllocations ?? 0} icon={ListTodo} accent="rose" loading={isLoading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Cases */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Recent Cases</h2>
              <Link href="/cases" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="px-5 py-3 flex items-center justify-between gap-4">
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))
              ) : !stats?.recentCases?.length ? (
                <p className="px-5 py-8 text-sm text-center text-slate-400 dark:text-slate-500">
                  No cases yet
                </p>
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
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">{c.referenceNumber}</p>
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

          {/* Upcoming Hearings */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Upcoming Hearings</h2>
              <Link href="/hearings" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="px-5 py-3 flex items-center justify-between gap-4">
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))
              ) : !stats?.upcomingHearings?.length ? (
                <p className="px-5 py-8 text-sm text-center text-slate-400 dark:text-slate-500">
                  No upcoming hearings
                </p>
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
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {h.hearingDate} · {h.hearingTime} · {h.judge}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_BADGE[h.status] ?? ''}`}
                      >
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
            { label: 'New Case', href: '/cases', colour: 'bg-blue-600 hover:bg-blue-700' },
            { label: 'Schedule Hearing', href: '/hearings', colour: 'bg-emerald-600 hover:bg-emerald-700' },
            { label: 'Upload Document', href: '/documents', colour: 'bg-violet-600 hover:bg-violet-700' },
            { label: 'View Queue', href: '/queue', colour: 'bg-amber-600 hover:bg-amber-700' },
          ].map(({ label, href, colour }) => (
            <Link
              key={label}
              href={href}
              className={`${colour} text-white text-sm font-medium px-4 py-2.5 rounded-lg text-center transition-colors`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </ClerkOSLayout>
  );
}
