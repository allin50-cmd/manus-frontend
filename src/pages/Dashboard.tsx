import ClerkOSLayout from '@/components/layout/ClerkOSLayout';
import { trpc } from '@/lib/trpc';
import { Scale, Gavel, ListTodo, TrendingUp, AlertCircle } from 'lucide-react';

function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'blue',
}: {
  label: string;
  value: number | string;
  icon: React.FC<{ className?: string }>;
  accent?: 'blue' | 'emerald' | 'amber' | 'violet';
}) {
  const colours = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    violet: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400',
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">{value}</p>
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
  });

  return (
    <ClerkOSLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Court Clerk Management Overview
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

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Cases"
            value={isLoading ? '—' : (stats?.totalCases ?? 0)}
            icon={Scale}
            accent="blue"
          />
          <StatCard
            label="Active Cases"
            value={isLoading ? '—' : (stats?.activeCases ?? 0)}
            icon={TrendingUp}
            accent="emerald"
          />
          <StatCard
            label="Pending Hearings"
            value={isLoading ? '—' : (stats?.pendingHearings ?? 0)}
            icon={Gavel}
            accent="amber"
          />
          <StatCard
            label="Queue Items"
            value={isLoading ? '—' : (stats?.pendingAllocations ?? 0)}
            icon={ListTodo}
            accent="violet"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Cases */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Recent Cases
              </h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {!stats?.recentCases?.length ? (
                <p className="px-5 py-8 text-sm text-center text-slate-400 dark:text-slate-500">
                  No cases found
                </p>
              ) : (
                stats.recentCases.map((c) => (
                  <div key={c.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate max-w-[200px]">
                        {c.title}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{c.referenceNumber}</p>
                    </div>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[c.status] ?? ''}`}
                    >
                      {c.status.replace('_', ' ')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Hearings */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Upcoming Hearings
              </h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {!stats?.upcomingHearings?.length ? (
                <p className="px-5 py-8 text-sm text-center text-slate-400 dark:text-slate-500">
                  No upcoming hearings
                </p>
              ) : (
                stats.upcomingHearings.map((h) => (
                  <div key={h.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {h.courtroom}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {h.hearingDate} · {h.hearingTime}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[h.status] ?? ''}`}
                    >
                      {h.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </ClerkOSLayout>
  );
}
