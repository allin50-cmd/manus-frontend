import ClerkOSLayout from '@/components/layout/ClerkOSLayout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cacheRead, cacheWrite, formatCacheAge } from '@/lib/offlineCache';
import { trpc } from '@/lib/trpc';
import { Search, AlertCircle, Clock, Plus, ChevronRight, ArrowRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

const STATUSES = ['all', 'open', 'in_progress', 'closed', 'on_hold'] as const;
type StatusFilter = (typeof STATUSES)[number];

const TRANSITIONS: Record<string, string[]> = {
  open: ['in_progress', 'on_hold', 'closed'],
  in_progress: ['on_hold', 'closed'],
  on_hold: ['in_progress', 'closed'],
  closed: [],
};

const STATUS_BADGE: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  closed: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  on_hold: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

const TRANSITION_COLOUR: Record<string, string> = {
  in_progress: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40',
  on_hold: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 hover:bg-orange-100',
  closed: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700',
};

type Case = {
  id: number;
  referenceNumber: string;
  title: string;
  caseType: string;
  plaintiff: string;
  defendant: string;
  judge?: string | null;
  status: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function NewCaseDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const utils = trpc.useContext();
  const idempotencyKey = useRef(crypto.randomUUID());
  const create = trpc.cases.create.useMutation({
    onSuccess: () => {
      utils.cases.list.invalidate();
      utils.dashboard.stats.invalidate();
      onOpenChange(false);
      idempotencyKey.current = crypto.randomUUID();
      toast.success('Case created');
    },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    referenceNumber: '',
    title: '',
    caseType: 'civil',
    plaintiff: '',
    defendant: '',
    judge: '',
    description: '',
  });

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate({
      referenceNumber: form.referenceNumber,
      title: form.title,
      caseType: form.caseType,
      plaintiff: form.plaintiff,
      defendant: form.defendant,
      judge: form.judge || undefined,
      description: form.description || undefined,
      idempotencyKey: idempotencyKey.current,
    });
  };

  const inputClass =
    'w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Case</DialogTitle>
          <DialogDescription>Register a new matter in the court record.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Reference Number *
              </label>
              <input {...field('referenceNumber')} required placeholder="2024-CIV-001" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Case Type *
              </label>
              <select {...field('caseType')} className={inputClass}>
                {['civil', 'criminal', 'family', 'commercial', 'administrative'].map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Case Title *
            </label>
            <input {...field('title')} required placeholder="Smith v. Jones" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Plaintiff *
              </label>
              <input {...field('plaintiff')} required placeholder="Full name" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Defendant *
              </label>
              <input {...field('defendant')} required placeholder="Full name" className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Presiding Judge
            </label>
            <input {...field('judge')} placeholder="Judge name" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Notes
            </label>
            <textarea {...field('description')} rows={2} placeholder="Optional description" className={inputClass} />
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
              {create.isLoading ? 'Creating…' : 'Create Case'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CaseDetailPanel({
  caseItem,
  onClose,
}: {
  caseItem: Case;
  onClose: () => void;
}) {
  const utils = trpc.useContext();
  const transition = trpc.cases.transition.useMutation({
    onSuccess: () => {
      utils.cases.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success('Case status updated');
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const nextStates = TRANSITIONS[caseItem.status] ?? [];

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <aside className="w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-mono text-slate-400 dark:text-slate-500">{caseItem.referenceNumber}</p>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">{caseItem.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-5">
          {/* Status + type */}
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_BADGE[caseItem.status] ?? ''}`}
            >
              {caseItem.status.replace('_', ' ')}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 capitalize">{caseItem.caseType}</span>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">
                Plaintiff
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{caseItem.plaintiff}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">
                Defendant
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{caseItem.defendant}</p>
            </div>
          </div>

          {caseItem.judge && (
            <div>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">
                Judge
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{caseItem.judge}</p>
            </div>
          )}

          {caseItem.description && (
            <div>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">
                Description
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{caseItem.description}</p>
            </div>
          )}

          <div className="text-xs text-slate-400 dark:text-slate-500">
            Created {new Date(caseItem.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>

          {/* State machine transitions */}
          {nextStates.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">
                Transition Status
              </p>
              <div className="flex flex-wrap gap-2">
                {nextStates.map((next) => (
                  <button
                    key={next}
                    onClick={() => transition.mutate({ id: caseItem.id, status: next as 'open' | 'in_progress' | 'on_hold' | 'closed' })}
                    disabled={transition.isLoading}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${TRANSITION_COLOUR[next] ?? ''}`}
                  >
                    <ArrowRight className="w-3 h-3" />
                    {next.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

export default function Cases() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState<Case | null>(null);

  const cacheKey = `cases.list.${status}`;

  const listQuery = trpc.cases.list.useQuery(
    status === 'all' ? undefined : { status },
  );

  const searchQuery = trpc.cases.search.useQuery(
    { query: search },
    { enabled: search.trim().length > 1 },
  );

  useEffect(() => {
    if (listQuery.data) cacheWrite(cacheKey, listQuery.data);
  }, [listQuery.data, cacheKey]);

  const cachedEntry = useMemo(
    () => (!listQuery.data && listQuery.error ? cacheRead<typeof listQuery.data>(cacheKey) : null),
    [listQuery.data, listQuery.error, cacheKey],
  );

  const listCases = listQuery.data ?? cachedEntry?.data ?? [];
  const cases = search.trim().length > 1 ? (searchQuery.data ?? []) : listCases;
  const isLoading = search.trim().length > 1 ? searchQuery.isLoading : listQuery.isLoading;
  const hasError = listQuery.error || searchQuery.error;
  const isFromCache = !listQuery.data && !!cachedEntry?.data;
  const staleAgeLabel = cachedEntry ? formatCacheAge(cachedEntry.ageMs) : undefined;

  return (
    <ClerkOSLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Cases</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Matter index — all active and archived cases
            </p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Case
          </button>
        </div>

        {hasError && isFromCache && (
          <div className="mb-4 flex items-center justify-between gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <div className="flex items-center gap-3 min-w-0">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Showing cached data from {staleAgeLabel} — live data unavailable.
              </p>
            </div>
            <button onClick={() => listQuery.refetch()} className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 flex-shrink-0 transition-colors">
              Retry
            </button>
          </div>
        )}
        {hasError && !isFromCache && (
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
                {['Reference', 'Title', 'Type', 'Plaintiff', 'Defendant', 'Judge', 'Status', ''].map((h) => (
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
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-sm">
                    {search ? 'No cases match your search' : 'No cases found — create one to get started'}
                  </td>
                </tr>
              ) : (
                cases.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    onClick={() => setSelected(c as Case)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                      {c.referenceNumber}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 max-w-[180px] truncate">
                      {c.title}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 capitalize">{c.caseType}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
                      {c.plaintiff}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
                      {c.defendant}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 truncate max-w-[110px]">
                      {c.judge ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[c.status] ?? ''}`}
                      >
                        {c.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {cases.length > 0 && (
          <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
            {cases.length} case{cases.length !== 1 ? 's' : ''} shown
          </p>
        )}
      </div>

      <NewCaseDialog open={showNew} onOpenChange={setShowNew} />
      {selected && <CaseDetailPanel caseItem={selected} onClose={() => setSelected(null)} />}
    </ClerkOSLayout>
  );
}
