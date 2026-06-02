import ClerkOSLayout from '@/components/layout/ClerkOSLayout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import { AlertCircle, CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

function getWeekDays(anchor: Date): Date[] {
  const dow = anchor.getDay();
  const monday = addDays(anchor, -((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

const DEMO_CLERK_ID = 1;

function AddEntryDialog({
  open,
  onOpenChange,
  date,
  hearings,
  allocations,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  date: string;
  hearings: { id: number; courtroom: string; hearingDate: string }[];
  allocations: { id: number; taskType: string }[];
}) {
  const utils = trpc.useContext();
  const create = trpc.diary.create.useMutation({
    onSuccess: () => {
      utils.diary.getByClerkAndDate.invalidate({ clerkId: DEMO_CLERK_ID, date });
      onOpenChange(false);
      toast.success('Diary entry added');
    },
    onError: (e) => toast.error(e.message),
  });

  const [hearingId, setHearingId] = useState('');
  const [allocationId, setAllocationId] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate({
      clerkId: DEMO_CLERK_ID,
      date,
      hearingId: hearingId ? Number(hearingId) : undefined,
      allocationId: allocationId ? Number(allocationId) : undefined,
      notes: notes || undefined,
    });
  };

  const inputClass =
    'w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

  const todayHearings = hearings.filter((h) => h.hearingDate === date);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Diary Entry</DialogTitle>
          <DialogDescription>
            {new Date(date + 'T00:00:00').toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {todayHearings.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Link Hearing
              </label>
              <select value={hearingId} onChange={(e) => setHearingId(e.target.value)} className={inputClass}>
                <option value="">None</option>
                {todayHearings.map((h) => (
                  <option key={h.id} value={String(h.id)}>
                    Hearing #{h.id} — {h.courtroom}
                  </option>
                ))}
              </select>
            </div>
          )}
          {allocations.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Link Task
              </label>
              <select value={allocationId} onChange={(e) => setAllocationId(e.target.value)} className={inputClass}>
                <option value="">None</option>
                {allocations.map((a) => (
                  <option key={a.id} value={String(a.id)}>
                    Task #{a.id} — {a.taskType}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Diary entry notes…"
              className={inputClass}
            />
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
              disabled={create.isLoading || (!notes && !hearingId && !allocationId)}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {create.isLoading ? 'Saving…' : 'Add Entry'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Diary() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAdd, setShowAdd] = useState(false);
  const dateStr = formatDate(selectedDate);
  const weekDays = getWeekDays(selectedDate);
  const today = formatDate(new Date());

  const { data: entries = [], isLoading, error } = trpc.diary.getByClerkAndDate.useQuery(
    { clerkId: DEMO_CLERK_ID, date: dateStr },
    { retry: false },
  );

  const { data: hearings = [] } = trpc.hearings.list.useQuery(undefined, { retry: false });
  const { data: allocations = [] } = trpc.allocations.getByClerk.useQuery(
    { clerkId: DEMO_CLERK_ID },
    { retry: false },
  );

  const formattedDisplay = selectedDate.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <ClerkOSLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Diary</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Scheduling layer — time-based events for today's clerk session
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Entry
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Database not connected — no diary entries to display.
            </p>
          </div>
        )}

        {/* Week strip */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 mb-5">
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((d) => {
              const ds = formatDate(d);
              const isSelected = ds === dateStr;
              const isToday = ds === today;
              return (
                <button
                  key={ds}
                  onClick={() => setSelectedDate(d)}
                  className={[
                    'flex flex-col items-center py-2 px-1 rounded-lg text-center transition-colors',
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : isToday
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400',
                  ].join(' ')}
                >
                  <span className="text-[10px] font-medium uppercase">
                    {d.toLocaleDateString('en-GB', { weekday: 'short' })}
                  </span>
                  <span className="text-sm font-bold mt-0.5">{d.getDate()}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date navigation */}
        <div className="flex items-center gap-4 mb-5">
          <button
            onClick={() => setSelectedDate((d) => addDays(d, -1))}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>

          <div className="flex-1 text-center">
            <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{formattedDisplay}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">{dateStr}</p>
          </div>

          <button
            onClick={() => setSelectedDate((d) => addDays(d, 1))}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>

          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
          >
            Today
          </button>
        </div>

        {/* Today's hearings banner */}
        {hearings.filter((h) => h.hearingDate === dateStr && h.status === 'scheduled').length > 0 && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 rounded-xl flex items-center gap-3">
            <CalendarDays className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              {hearings.filter((h) => h.hearingDate === dateStr && h.status === 'scheduled').length} hearing
              {hearings.filter((h) => h.hearingDate === dateStr && h.status === 'scheduled').length !== 1 ? 's' : ''}{' '}
              scheduled for this day
            </p>
          </div>
        )}

        {/* Entries */}
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                </div>
              </div>
            ))
          ) : entries.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-10 text-center">
              <CalendarDays className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                No diary entries for this date
              </p>
              <button
                onClick={() => setShowAdd(true)}
                className="mt-3 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Add one
              </button>
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                    <CalendarDays className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {entry.hearingId && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          Hearing #{entry.hearingId}
                        </span>
                      )}
                      {entry.allocationId && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                          Task #{entry.allocationId}
                        </span>
                      )}
                    </div>
                    {entry.notes && (
                      <p className="text-sm text-slate-700 dark:text-slate-300">{entry.notes}</p>
                    )}
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Added{' '}
                      {new Date(entry.createdAt).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AddEntryDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        date={dateStr}
        hearings={hearings}
        allocations={allocations}
      />
    </ClerkOSLayout>
  );
}
