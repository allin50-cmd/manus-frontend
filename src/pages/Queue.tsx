import ClerkOSLayout from '@/components/layout/ClerkOSLayout';
import { trpc } from '@/lib/trpc';
import { AlertCircle, Clock } from 'lucide-react';

const PRIORITY_BADGE: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

export default function Queue() {
  const utils = trpc.useContext();

  const { data: allocations = [], isLoading, error } = trpc.allocations.getPending.useQuery(
    undefined,
    { retry: false },
  );

  const updateMutation = trpc.allocations.update.useMutation({
    onSuccess: () => utils.allocations.getPending.invalidate(),
  });

  const handleStatusChange = (id: number, status: 'pending' | 'in_progress' | 'completed' | 'cancelled') => {
    updateMutation.mutate({ id, status });
  };

  return (
    <ClerkOSLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Queue</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Workflow ingestion — pending clerk task allocations
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Database not connected — no queue items to display.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {isLoading ? (
            <div className="text-sm text-slate-400 text-center py-10">Loading…</div>
          ) : allocations.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-10 text-center">
              <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400 dark:text-slate-500">No pending allocations</p>
            </div>
          ) : (
            allocations.map((a) => (
              <div
                key={a.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
                      {a.taskType}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${PRIORITY_BADGE[a.priority] ?? ''}`}
                    >
                      {a.priority}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[a.status] ?? ''}`}
                    >
                      {a.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Case #{a.caseId} · Clerk #{a.clerkId}
                    {a.dueDate ? ` · Due ${a.dueDate}` : ''}
                  </p>
                  {a.notes && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{a.notes}</p>
                  )}
                </div>

                {/* Quick actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleStatusChange(a.id, 'in_progress')}
                    disabled={updateMutation.isLoading}
                    className="px-2.5 py-1 text-xs rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50"
                  >
                    Start
                  </button>
                  <button
                    onClick={() => handleStatusChange(a.id, 'completed')}
                    disabled={updateMutation.isLoading}
                    className="px-2.5 py-1 text-xs rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors disabled:opacity-50"
                  >
                    Done
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </ClerkOSLayout>
  );
}
