import ClerkOSLayout from '@/components/layout/ClerkOSLayout';
import { trpc } from '@/lib/trpc';
import { AlertCircle, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

// For demo purposes, use clerk ID 1 — in a real system this comes from auth context
const DEMO_CLERK_ID = 1;

export default function Diary() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateStr = formatDate(selectedDate);

  const { data: entries = [], isLoading, error } = trpc.diary.getByClerkAndDate.useQuery(
    { clerkId: DEMO_CLERK_ID, date: dateStr },
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
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Diary</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Scheduling layer — time-based events for today's clerk session
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Database not connected — no diary entries to display.
            </p>
          </div>
        )}

        {/* Date navigation */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setSelectedDate((d) => addDays(d, -1))}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>

          <div className="flex-1 text-center">
            <p className="font-semibold text-slate-900 dark:text-slate-100">{formattedDisplay}</p>
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

        {/* Entries */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-sm text-slate-400 text-center py-10">Loading…</div>
          ) : entries.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-10 text-center">
              <CalendarDays className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                No diary entries for this date
              </p>
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
                    <div className="flex items-center gap-2 mb-1">
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
                      Added {new Date(entry.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </ClerkOSLayout>
  );
}
