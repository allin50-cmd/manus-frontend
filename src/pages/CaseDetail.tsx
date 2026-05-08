import { useState } from 'react';
import { useParams, Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import type { Case } from '../../server/drizzle/schema';
import ClerkOSLayout from '@/components/layout/ClerkOSLayout';
import {
  ArrowLeft,
  Gavel,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Scale,
  User,
  Calendar,
  ClipboardList,
  History,
  Package,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  open: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  on_hold: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  closed: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

const PRIORITY_BADGE: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const HEARING_BADGE: Record<string, string> = {
  scheduled: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  completed: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  postponed: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

type TabId = 'overview' | 'hearings' | 'documents' | 'allocations' | 'audit';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: Scale },
  { id: 'hearings', label: 'Hearings', icon: Gavel },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'allocations', label: 'Allocations', icon: ClipboardList },
  { id: 'audit', label: 'Audit Trail', icon: History },
];

// Workflow steps and which statuses mark them done
const WORKFLOW = [
  { label: 'Case Created', doneWhen: () => true },
  { label: 'In Progress', doneWhen: (s: string) => ['in_progress', 'closed'].includes(s) },
  { label: 'Hearing Scheduled', doneWhen: (_s: string, hasHearing: boolean) => hasHearing },
  { label: 'Documents Uploaded', doneWhen: (_s: string, _h: boolean, hasDocs: boolean) => hasDocs },
  { label: 'Bundle Ready', doneWhen: (_s: string, _h: boolean, _d: boolean, bundleApproved: boolean) => bundleApproved },
  { label: 'Closed', doneWhen: (s: string) => s === 'closed' },
];

// ── Tab content ───────────────────────────────────────────────────────────────

function OverviewTab({ caseData }: { caseData: Case }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            Parties
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Plaintiff</p>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{caseData.plaintiff}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Defendant</p>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{caseData.defendant}</p>
              </div>
            </div>
            {caseData.judge && (
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                  <Gavel className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">Assigned Judge</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{caseData.judge}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {caseData.description && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              Description
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{caseData.description}</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            Details
          </h3>
          <dl className="space-y-2.5">
            {[
              { label: 'Reference', value: caseData.referenceNumber },
              { label: 'Type', value: caseData.caseType },
              { label: 'Status', value: caseData.status.replace('_', ' ') },
              {
                label: 'Created',
                value: new Date(caseData.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric',
                }),
              },
              {
                label: 'Last Updated',
                value: new Date(caseData.updatedAt).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric',
                }),
              },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <dt className="text-xs text-slate-400 dark:text-slate-500 shrink-0">{label}</dt>
                <dd className="text-xs font-medium text-slate-700 dark:text-slate-300 text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

function HearingsTab({ caseId }: { caseId: number }) {
  const { data: hearings = [], isLoading, error } = trpc.hearings.getByCaseId.useQuery(
    { caseId },
    { retry: false },
  );
  const today = new Date().toISOString().split('T')[0];
  const sorted = [...hearings].sort((a, b) => a.hearingDate.localeCompare(b.hearingDate));

  if (isLoading) return <LoadingRows cols={5} />;
  if (error) return <DbError />;
  if (sorted.length === 0) return (
    <EmptyState icon={Gavel} message="No hearings scheduled for this case." action={{ label: 'Schedule hearing', href: '/hearings' }} />
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800">
            {['Date', 'Time', 'Courtroom', 'Judge', 'Status', 'Notes'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {sorted.map((h) => {
            const isToday = h.hearingDate === today;
            return (
              <tr key={h.id} className={isToday ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium text-sm ${isToday ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-slate-100'}`}>
                      {new Date(h.hearingDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {isToday && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white">TODAY</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{h.hearingTime}</td>
                <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{h.courtroom}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400 truncate max-w-[140px]">{h.judge}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${HEARING_BADGE[h.status] ?? ''}`}>{h.status}</span>
                </td>
                <td className="px-4 py-3 text-slate-400 dark:text-slate-500 truncate max-w-[160px]">{h.notes ?? '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DocumentsTab({ caseId }: { caseId: number }) {
  const utils = trpc.useContext();
  const { data: docs = [], isLoading, error } = trpc.documents.getByCaseId.useQuery(
    { caseId },
    { retry: false },
  );
  const approveMutation = trpc.documents.approveForBundle.useMutation({
    onSuccess: () => utils.documents.getByCaseId.invalidate({ caseId }),
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <LoadingRows cols={5} />;
  if (error) return <DbError />;
  if (docs.length === 0) return (
    <EmptyState icon={FileText} message="No documents uploaded for this case." action={{ label: 'Upload documents', href: '/documents' }} />
  );

  const approved = docs.filter((d) => d.approvedForBundle).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        <span>{approved} of {docs.length} approved for bundle</span>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              {['File Name', 'Type', 'Size', 'Uploaded', 'Bundle'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {docs.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[200px]">{d.fileName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400 uppercase text-xs">{d.fileType.split('/').pop()}</td>
                <td className="px-4 py-3 text-slate-400 dark:text-slate-500 text-xs">
                  {d.fileSize ? `${(d.fileSize / 1024).toFixed(0)} KB` : '—'}
                </td>
                <td className="px-4 py-3 text-slate-400 dark:text-slate-500 text-xs">
                  {new Date(d.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => approveMutation.mutate({ id: d.id, approved: !d.approvedForBundle })}
                    disabled={approveMutation.isLoading}
                    className="disabled:opacity-50 transition-colors"
                  >
                    {d.approvedForBundle
                      ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      : <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-slate-400" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AllocationsTab({ caseId }: { caseId: number }) {
  const utils = trpc.useContext();
  const { data: allocs = [], isLoading, error } = trpc.allocations.getByCase.useQuery(
    { caseId },
    { retry: false },
  );
  const updateMutation = trpc.allocations.update.useMutation({
    onSuccess: () => utils.allocations.getByCase.invalidate({ caseId }),
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <LoadingRows cols={5} />;
  if (error) return <DbError />;
  if (allocs.length === 0) return (
    <EmptyState icon={ClipboardList} message="No tasks allocated for this case." action={{ label: 'Go to Queue', href: '/queue' }} />
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800">
            {['Task', 'Priority', 'Status', 'Due', 'Notes', ''].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {allocs.map((a) => (
            <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{a.taskType}</td>
              <td className="px-4 py-3">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${PRIORITY_BADGE[a.priority] ?? ''}`}>{a.priority}</span>
              </td>
              <td className="px-4 py-3">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[a.status] ?? ''}`}>{a.status.replace('_', ' ')}</span>
              </td>
              <td className="px-4 py-3 text-slate-400 text-xs">
                {a.dueDate ? new Date(a.dueDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
              </td>
              <td className="px-4 py-3 text-slate-400 dark:text-slate-500 text-xs truncate max-w-[160px]">{a.notes ?? '—'}</td>
              <td className="px-4 py-3">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => updateMutation.mutate({ id: a.id, status: 'in_progress' })}
                    disabled={updateMutation.isLoading || a.status === 'in_progress' || a.status === 'completed'}
                    className="px-2 py-1 text-xs rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 disabled:opacity-40 transition-colors"
                  >
                    Start
                  </button>
                  <button
                    onClick={() => updateMutation.mutate({ id: a.id, status: 'completed' })}
                    disabled={updateMutation.isLoading || a.status === 'completed'}
                    className="px-2 py-1 text-xs rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 disabled:opacity-40 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AuditTab({ caseId }: { caseId: number }) {
  const { data: events = [], isLoading, error } = trpc.cases.getAuditTrail.useQuery(
    { id: caseId },
    { retry: false },
  );

  if (isLoading) return <LoadingRows cols={4} />;
  if (error) return <DbError />;
  if (events.length === 0) return (
    <EmptyState icon={History} message="No audit events recorded for this case yet." />
  );

  return (
    <div className="space-y-2">
      {events.map((ev) => (
        <div key={ev.id} className="flex items-start gap-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3">
          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
            <History className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100 capitalize">
                {ev.action.replace(/[_:]/g, ' ')}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                by {ev.actorOpenId ?? `user #${ev.actorId}`}
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {new Date(ev.createdAt).toLocaleString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Shared mini-components ────────────────────────────────────────────────────

function LoadingRows({ cols }: { cols: number }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <table className="w-full">
        <tbody>
          {[1, 2, 3].map((i) => (
            <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
              {Array.from({ length: cols }).map((_, j) => (
                <td key={j} className="px-4 py-3">
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DbError() {
  return (
    <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
      <p className="text-sm text-amber-700 dark:text-amber-300">Database not connected.</p>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  message,
  action,
}: {
  icon: React.ElementType;
  message: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-10 text-center">
      <Icon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
      <p className="text-sm text-slate-400 dark:text-slate-500">{message}</p>
      {action && (
        <Link href={action.href}>
          <button className="mt-3 text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mx-auto">
            <Plus className="w-3 h-3" /> {action.label}
          </button>
        </Link>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CaseDetail() {
  const params = useParams<{ id: string }>();
  const caseId = Number(params.id);
  const [tab, setTab] = useState<TabId>('overview');
  const utils = trpc.useContext();

  const { data: caseData, isLoading, error } = trpc.cases.getById.useQuery(
    { id: caseId },
    { enabled: !isNaN(caseId), retry: false },
  );

  // Lightweight counts for workflow progress indicators
  const { data: hearings = [] } = trpc.hearings.getByCaseId.useQuery(
    { caseId },
    { enabled: !isNaN(caseId), retry: false },
  );
  const { data: docs = [] } = trpc.documents.getByCaseId.useQuery(
    { caseId },
    { enabled: !isNaN(caseId), retry: false },
  );

  const transitionMutation = trpc.cases.transition.useMutation({
    onSuccess: () => {
      utils.cases.getById.invalidate({ id: caseId });
      toast.success('Status updated');
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <ClerkOSLayout>
        <div className="p-6 max-w-5xl mx-auto space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 animate-pulse">
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-3" />
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      </ClerkOSLayout>
    );
  }

  if (error || !caseData) {
    return (
      <ClerkOSLayout>
        <div className="p-6 max-w-5xl mx-auto">
          <DbError />
          <Link href="/cases">
            <button className="mt-4 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-slate-100">
              <ArrowLeft className="w-4 h-4" /> Back to Cases
            </button>
          </Link>
        </div>
      </ClerkOSLayout>
    );
  }

  const hasHearing = hearings.length > 0;
  const hasDocs = docs.length > 0;
  const hasBundleDoc = docs.some((d) => d.approvedForBundle);

  // Workflow progress
  let workflowStep = -1;
  WORKFLOW.forEach((step, i) => {
    if (step.doneWhen(caseData.status, hasHearing, hasDocs, hasBundleDoc)) workflowStep = i;
  });

  const VALID_NEXT: Record<string, string[]> = {
    open: ['in_progress', 'on_hold', 'closed'],
    in_progress: ['closed', 'on_hold', 'open'],
    on_hold: ['open', 'in_progress', 'closed'],
    closed: ['open'],
  };
  const nextStatuses = VALID_NEXT[caseData.status] ?? [];

  return (
    <ClerkOSLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        {/* ── Breadcrumb ── */}
        <Link href="/cases">
          <button className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Cases
          </button>
        </Link>

        {/* ── Case header ── */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Scale className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{caseData.referenceNumber}</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[caseData.status] ?? ''}`}>
                  {caseData.status.replace('_', ' ')}
                </span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{caseData.title}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{caseData.caseType}</p>
            </div>

            {/* Status transition buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {nextStatuses.map((s) => (
                <button
                  key={s}
                  onClick={() => transitionMutation.mutate({ id: caseId, status: s as 'open' | 'in_progress' | 'closed' | 'on_hold' })}
                  disabled={transitionMutation.isLoading}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                >
                  → {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* ── Workflow progress bar ── */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Workflow Progress</p>
            <div className="flex items-center gap-0">
              {WORKFLOW.map((step, i) => {
                const done = i <= workflowStep;
                const active = i === workflowStep + 1;
                return (
                  <div key={step.label} className="flex items-center flex-1 min-w-0">
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        done
                          ? 'bg-emerald-500 text-white'
                          : active
                          ? 'bg-blue-600 text-white ring-2 ring-blue-300 dark:ring-blue-800'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                      }`}>
                        {done ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <span className="text-[9px] font-bold">{i + 1}</span>
                        )}
                      </div>
                      <p className={`text-[9px] mt-1 text-center leading-tight ${
                        done ? 'text-emerald-600 dark:text-emerald-400' : active ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-400'
                      }`}>
                        {step.label}
                      </p>
                    </div>
                    {i < WORKFLOW.length - 1 && (
                      <div className={`flex-1 h-px mx-1 -mt-4 ${done ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Stat pills ── */}
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {[
            { label: 'Hearings', value: hearings.length, icon: Gavel, color: 'text-blue-600' },
            { label: 'Documents', value: docs.length, icon: FileText, color: 'text-purple-600' },
            { label: 'Bundle Approved', value: hasBundleDoc ? 'Yes' : 'No', icon: Package, color: hasBundleDoc ? 'text-emerald-600' : 'text-slate-400' },
            { label: 'Judge', value: caseData.judge ?? 'TBC', icon: Gavel, color: 'text-amber-600' },
            { label: 'Type', value: caseData.caseType, icon: Scale, color: 'text-slate-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-3 flex items-center gap-2">
              <Icon className={`w-4 h-4 shrink-0 ${color}`} />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 truncate">{label}</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 flex-wrap">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                tab === id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800',
              ].join(' ')}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        {tab === 'overview' && <OverviewTab caseData={caseData} />}
        {tab === 'hearings' && <HearingsTab caseId={caseId} />}
        {tab === 'documents' && <DocumentsTab caseId={caseId} />}
        {tab === 'allocations' && <AllocationsTab caseId={caseId} />}
        {tab === 'audit' && <AuditTab caseId={caseId} />}
      </div>
    </ClerkOSLayout>
  );
}
