import ClerkOSLayout from '@/components/layout/ClerkOSLayout';
import { trpc } from '@/lib/trpc';
import { AlertCircle, Gavel } from 'lucide-react';
import { useState } from 'react';

const STATUSES = ['all', 'scheduled', 'completed', 'postponed', 'cancelled'] as const;
type StatusFilter = (typeof STATUSES)[number];

const STATUS_BADGE: Record<string, string> = {
  scheduled: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  completed: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  postponed: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

export default function Hearings() {
  const [status, setStatus] = useState<StatusFilter>('all');

  const { data: hearings = [], isLoading, error } = trpc.hearings.list.useQuery(
    status === 'all' ? undefined : { status },
    { retry: false },
  );

  return (
    <ClerkOSLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Hearings</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Procedural timeline — all scheduled court events
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Gavel className="w-4 h-4" />
            <span>{hearings.length} hearing{hearings.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Database not connected — no hearings to display.
            </p>
          </div>
        )}

        {/* Status filter */}
        <div className="flex gap-1 flex-wrap mb-5">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={[
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                status === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800',
              ].join(' ')}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                {['Date', 'Time', 'Courtroom', 'Judge', 'Status', 'Notes'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">
                    Loading…
                  </td>
                </tr>
              ) : hearings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">
                    No hearings found
                  </td>
                </tr>
              ) : (
                hearings.map((h) => (
                  <tr
                    key={h.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      {h.hearingDate}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{h.hearingTime}</td>
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{h.courtroom}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 truncate max-w-[140px]">
                      {h.judge}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[h.status] ?? ''}`}
                      >
                        {h.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 dark:text-slate-500 truncate max-w-[180px]">
                      {h.notes ?? '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ClerkOSLayout>
  );
}
