import ClerkOSLayout from '@/components/layout/ClerkOSLayout';
import { trpc } from '@/lib/trpc';
import { Search, AlertCircle } from 'lucide-react';
import { useState } from 'react';

const STATUSES = ['all', 'open', 'in_progress', 'closed', 'on_hold'] as const;
type StatusFilter = (typeof STATUSES)[number];

const STATUS_BADGE: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  closed: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  on_hold: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

export default function Cases() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');

  const listQuery = trpc.cases.list.useQuery(
    status === 'all' ? undefined : { status },
    { retry: false },
  );

  const searchQuery = trpc.cases.search.useQuery(
    { query: search },
    { enabled: search.trim().length > 1, retry: false },
  );

  const cases = search.trim().length > 1
    ? (searchQuery.data ?? [])
    : (listQuery.data ?? []);

  const isLoading = search.trim().length > 1 ? searchQuery.isLoading : listQuery.isLoading;
  const hasError = listQuery.error || searchQuery.error;

  return (
    <ClerkOSLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Cases</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Matter index — all active and archived cases
          </p>
        </div>

        {hasError && (
          <div className="mb-4 flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Database not connected — no cases to display.
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search cases…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-1 flex-wrap">
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
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                {['Reference', 'Title', 'Type', 'Plaintiff', 'Defendant', 'Judge', 'Status'].map((h) => (
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
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400 text-sm">
                    Loading…
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400 text-sm">
                    No cases found
                  </td>
                </tr>
              ) : (
                cases.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                      {c.referenceNumber}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 max-w-[200px] truncate">
                      {c.title}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{c.caseType}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                      {c.plaintiff}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                      {c.defendant}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                      {c.judge ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[c.status] ?? ''}`}
                      >
                        {c.status.replace('_', ' ')}
                      </span>
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
