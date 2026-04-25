import ClerkOSLayout from '@/components/layout/ClerkOSLayout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import { AlertCircle, Gavel, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const STATUSES = ['all', 'scheduled', 'completed', 'postponed', 'cancelled'] as const;
type StatusFilter = (typeof STATUSES)[number];

const STATUS_BADGE: Record<string, string> = {
  scheduled: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  completed: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  postponed: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

function ScheduleDialog({
  open,
  onOpenChange,
  cases,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  cases: { id: number; referenceNumber: string; title: string }[];
}) {
  const utils = trpc.useContext();
  const create = trpc.hearings.create.useMutation({
    onSuccess: () => {
      utils.hearings.list.invalidate();
      utils.dashboard.stats.invalidate();
      onOpenChange(false);
      toast.success('Hearing scheduled');
    },
    onError: (e) => toast.error(e.message),
  });

  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    caseId: '',
    hearingDate: today,
    hearingTime: '10:00',
    courtroom: '',
    judge: '',
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
      hearingDate: form.hearingDate,
      hearingTime: form.hearingTime,
      courtroom: form.courtroom,
      judge: form.judge,
      notes: form.notes || undefined,
    });
  };

  const inputClass =
    'w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Hearing</DialogTitle>
          <DialogDescription>Assign a court date and room to a case.</DialogDescription>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Date *</label>
              <input type="date" {...field('hearingDate')} required className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Time *</label>
              <input type="time" {...field('hearingTime')} required className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Courtroom *</label>
              <input {...field('courtroom')} required placeholder="e.g. Court 3" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Judge *</label>
              <input {...field('judge')} required placeholder="Judge surname" className={inputClass} />
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
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {create.isLoading ? 'Scheduling…' : 'Schedule'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Hearings() {
  const [status, setStatus] = useState<StatusFilter>('all');
  const [showSchedule, setShowSchedule] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const { data: hearings = [], isLoading, error } = trpc.hearings.list.useQuery(
    status === 'all' ? undefined : { status },
    { retry: false },
  );
  const { data: cases = [] } = trpc.cases.list.useQuery(undefined, { retry: false });

  // Sort: today first, then upcoming, then past
  const sorted = [...hearings].sort((a, b) => {
    if (a.hearingDate === today && b.hearingDate !== today) return -1;
    if (b.hearingDate === today && a.hearingDate !== today) return 1;
    return a.hearingDate.localeCompare(b.hearingDate);
  });

  return (
    <ClerkOSLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Hearings</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Procedural timeline — all scheduled court events
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Gavel className="w-4 h-4" />
              <span>{hearings.length}</span>
            </div>
            <button
              onClick={() => setShowSchedule(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Schedule
            </button>
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
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">
                    No hearings found
                  </td>
                </tr>
              ) : (
                sorted.map((h) => {
                  const isToday = h.hearingDate === today;
                  const isPast = h.hearingDate < today && h.status === 'scheduled';
                  return (
                    <tr
                      key={h.id}
                      className={[
                        'transition-colors',
                        isToday
                          ? 'bg-blue-50/50 dark:bg-blue-900/10'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50',
                      ].join(' ')}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${isToday ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-slate-100'}`}>
                            {new Date(h.hearingDate + 'T00:00:00').toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          {isToday && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white">TODAY</span>
                          )}
                          {isPast && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">OVERDUE</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{h.hearingTime}</td>
                      <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{h.courtroom}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 truncate max-w-[140px]">
                        {h.judge}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[h.status] ?? ''}`}>
                          {h.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 dark:text-slate-500 truncate max-w-[180px]">
                        {h.notes ?? '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ScheduleDialog open={showSchedule} onOpenChange={setShowSchedule} cases={cases} />
    </ClerkOSLayout>
  );
}
