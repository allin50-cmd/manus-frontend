import ClerkOSLayout from '@/components/layout/ClerkOSLayout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, ListTodo, Plus, TimerReset } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

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

const PRIORITY_ORDER = ['urgent', 'high', 'medium', 'low'] as const;

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof ListTodo;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
        </div>
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function CreateAllocationDialog({
  open,
  onOpenChange,
  cases,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  cases: { id: number; referenceNumber: string; title: string }[];
}) {
  const utils = trpc.useContext();
  const create = trpc.allocations.create.useMutation({
    onSuccess: () => {
      utils.allocations.getPending.invalidate();
      utils.dashboard.stats.invalidate();
      onOpenChange(false);
      toast.success('Allocation created');
    },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    caseId: '',
    clerkId: '1',
    taskType: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    dueDate: '',
    notes: '',
  });

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.caseId) return toast.error('Select a case');
    create.mutate({
      caseId: Number(form.caseId),
      clerkId: Number(form.clerkId),
      taskType: form.taskType,
      priority: form.priority,
      dueDate: form.dueDate || undefined,
      notes: form.notes || undefined,
    });
  };

  const inputClass =
    'w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Allocation</DialogTitle>
          <DialogDescription>Assign a task to a clerk for a specific case.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Case *</label>
            <select {...field('caseId')} required className={inputClass}>
              <option value="">— Select case —</option>
              {cases.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.referenceNumber} · {c.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Task Type *</label>
            <input
              {...field('taskType')}
              required
              placeholder="e.g. Prepare Bundle, Serve Documents"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Priority</label>
              <select {...field('priority')} className={inputClass}>
                {['low', 'medium', 'high', 'urgent'].map((p) => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Due Date</label>
              <input type="date" {...field('dueDate')} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Notes</label>
            <textarea {...field('notes')} rows={2} placeholder="Optional notes" className={inputClass} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={create.isLoading}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {create.isLoading ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Queue() {
  const [showCreate, setShowCreate] = useState(false);
  const utils = trpc.useContext();

  const { data: allocations = [], isLoading, error } = trpc.allocations.getPending.useQuery(
    undefined,
    { retry: false },
  );
  const { data: cases = [] } = trpc.cases.list.useQuery(undefined, { retry: false });

  const updateMutation = trpc.allocations.update.useMutation({
    onSuccess: () => {
      utils.allocations.getPending.invalidate();
      utils.dashboard.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const today = new Date().toISOString().split('T')[0];

  const handleStatusChange = (
    id: number,
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled',
  ) => {
    updateMutation.mutate({ id, status });
  };

  const queueStats = allocations.reduce(
    (acc, item) => {
      if (item.status === 'pending') acc.pending += 1;
      if (item.status === 'in_progress') acc.inProgress += 1;
      if (item.priority === 'urgent') acc.urgent += 1;
      if (item.dueDate && item.dueDate < today) acc.overdue += 1;
      return acc;
    },
    { pending: 0, inProgress: 0, urgent: 0, overdue: 0 },
  );

  const grouped = PRIORITY_ORDER.reduce(
    (acc, p) => {
      const items = allocations.filter((a) => a.priority === p);
      if (items.length) acc[p] = items;
      return acc;
    },
    {} as Record<string, typeof allocations>,
  );

  return (
    <ClerkOSLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Work Queue</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              ClerkOS allocations, escalation work, and operator handoff tasks
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Allocate
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryCard
            label="Pending"
            value={queueStats.pending}
            icon={ListTodo}
            tone="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300"
          />
          <SummaryCard
            label="In Progress"
            value={queueStats.inProgress}
            icon={TimerReset}
            tone="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300"
          />
          <SummaryCard
            label="Urgent"
            value={queueStats.urgent}
            icon={AlertTriangle}
            tone="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300"
          />
          <SummaryCard
            label="Overdue"
            value={queueStats.overdue}
            icon={Clock}
            tone="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          />
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Queue data unavailable</p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
                The control surface is online, but the database-backed allocation feed did not respond.
              </p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
                <div className="space-y-2 animate-pulse">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : allocations.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-10 text-center">
            <CheckCircle2 className="w-9 h-9 text-emerald-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No active queue items</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              New allocations and human escalation tasks will appear here.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add allocation
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([priority, items]) => (
              <div key={priority}>
                <div className="flex items-center gap-2 mb-3">
                  {priority === 'urgent' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {priority}
                  </h3>
                  <span className="text-xs text-slate-400 dark:text-slate-500">({items.length})</span>
                </div>
                <div className="space-y-2">
                  {items.map((a) => {
                    const isOverdue = a.dueDate && a.dueDate < today;
                    return (
                      <div
                        key={a.id}
                        className={[
                          'rounded-lg border p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4',
                          isOverdue
                            ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800',
                        ].join(' ')}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
                              {a.taskType}
                            </span>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${PRIORITY_BADGE[a.priority] ?? ''}`}>
                              {a.priority}
                            </span>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[a.status] ?? ''}`}>
                              {a.status.replace('_', ' ')}
                            </span>
                            {isOverdue && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                OVERDUE
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Case #{a.caseId} · Clerk #{a.clerkId}
                            {a.dueDate && (
                              <span className={isOverdue ? ' text-red-500 font-medium' : ''}>
                                {' '}· Due {new Date(a.dueDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                          </p>
                          {a.notes && (
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{a.notes}</p>
                          )}
                        </div>

                        <div className="flex gap-2 flex-shrink-0 sm:justify-end">
                          <button
                            onClick={() => handleStatusChange(a.id, 'in_progress')}
                            disabled={updateMutation.isLoading || a.status === 'in_progress'}
                            className="px-2.5 py-1 text-xs rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-40"
                          >
                            Start
                          </button>
                          <button
                            onClick={() => handleStatusChange(a.id, 'completed')}
                            disabled={updateMutation.isLoading}
                            className="px-2.5 py-1 text-xs rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors disabled:opacity-40"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateAllocationDialog open={showCreate} onOpenChange={setShowCreate} cases={cases} />
    </ClerkOSLayout>
  );
}
