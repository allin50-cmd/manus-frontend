import { useState } from 'react';
import { Link } from 'wouter';
import { Brain, ChevronDown, ChevronUp, Loader2, AlertTriangle } from 'lucide-react';
import { trpc } from '@/lib/trpc';

// ── Types ──────────────────────────────────────────────────────────────────────

type Decision = 'ALLOW' | 'MODIFY' | 'DENY' | 'ESCALATE';
type Status = 'pending' | 'in_review' | 'matter_created' | 'rejected';

// ── Badge helpers ──────────────────────────────────────────────────────────────

function DecisionBadge({ decision }: { decision: string }) {
  const styles: Record<Decision, string> = {
    ALLOW: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    MODIFY: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    DENY: 'bg-red-500/20 text-red-300 border-red-500/30',
    ESCALATE: 'bg-red-900/40 text-red-300 border-red-700/40',
  };
  const cls = styles[decision as Decision] ?? 'bg-white/10 text-white/60 border-white/10';
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {decision}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<Status, string> = {
    pending: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    in_review: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    matter_created: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
  };
  const labels: Record<Status, string> = {
    pending: 'Pending',
    in_review: 'In Review',
    matter_created: 'Matter Created',
    rejected: 'Rejected',
  };
  const cls = styles[status as Status] ?? 'bg-white/10 text-white/60 border-white/10';
  const label = labels[status as Status] ?? status;
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  const styles: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-300 border-red-500/30',
    high: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    normal: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  };
  const cls = styles[urgency] ?? 'bg-white/10 text-white/60 border-white/10';
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold uppercase ${cls}`}>
      {urgency}
    </span>
  );
}

// ── Row component ──────────────────────────────────────────────────────────────

interface IntakeRow {
  id: string;
  name: string;
  email: string;
  issueType: string;
  decision: string;
  riskScore: number;
  urgency: string;
  status: string;
  createdAt: Date | string;
  lolaMessage: string | null;
  description: string;
}

function IntakeTableRow({
  row,
  onStatusChange,
  updating,
}: {
  row: IntakeRow;
  onStatusChange: (id: string, status: Status) => void;
  updating: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const formattedDate = new Date(row.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <>
      <tr
        className="border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-4 py-3">
          <div className="font-medium text-white text-sm">{row.name}</div>
          <div className="text-xs text-white/40 mt-0.5">{row.email}</div>
        </td>
        <td className="px-4 py-3 text-sm text-white/70">{row.issueType}</td>
        <td className="px-4 py-3">
          <DecisionBadge decision={row.decision} />
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            <div
              className="h-1.5 w-16 rounded-full bg-white/10 overflow-hidden"
              title={`Risk: ${row.riskScore}`}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(row.riskScore, 100)}%`,
                  backgroundColor:
                    row.riskScore >= 80 ? '#EF4444' : row.riskScore >= 50 ? '#F59E0B' : '#22C55E',
                }}
              />
            </div>
            <span className="text-xs text-white/50">{row.riskScore}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <UrgencyBadge urgency={row.urgency} />
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={row.status} />
        </td>
        <td className="px-4 py-3 text-xs text-white/40">{formattedDate}</td>
        <td className="px-4 py-3 text-white/40">
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-white/5 bg-white/[0.015]">
          <td colSpan={8} className="px-6 py-4">
            <div className="space-y-4">
              {/* Description */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-1.5">
                  Description
                </p>
                <p className="text-sm text-white/70 leading-relaxed">{row.description}</p>
              </div>

              {/* Lola message */}
              {row.lolaMessage && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/60 mb-1.5">
                    Lola Follow-up Message
                  </p>
                  <p className="text-sm text-white/70 leading-relaxed italic border-l-2 border-amber-500/30 pl-3">
                    {row.lolaMessage}
                  </p>
                </div>
              )}

              {/* Status update */}
              <div className="flex items-center gap-3 pt-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
                  Update status
                </p>
                <select
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white outline-none focus:border-[#00D4FF]/50 transition-colors"
                  value={row.status}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    e.stopPropagation();
                    onStatusChange(row.id, e.target.value as Status);
                  }}
                  disabled={updating}
                >
                  <option value="pending">Pending</option>
                  <option value="in_review">In Review</option>
                  <option value="matter_created">Matter Created</option>
                  <option value="rejected">Rejected</option>
                </select>
                {updating && <Loader2 className="w-3.5 h-3.5 animate-spin text-white/40" />}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function LunarDashboard() {
  const [statusFilter, setStatusFilter] = useState<Status | ''>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = trpc.lunar.list.useQuery(
    statusFilter ? { status: statusFilter } : undefined,
  );

  const utils = trpc.useUtils();
  const updateStatus = trpc.lunar.updateStatus.useMutation({
    onSuccess: () => {
      utils.lunar.list.invalidate();
    },
  });

  const handleStatusChange = async (id: string, status: Status) => {
    setUpdatingId(id);
    try {
      await updateStatus.mutateAsync({ id, status });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0C10] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B0C10]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00D4FF]/10">
              <Brain className="h-5 w-5 text-[#00D4FF]" />
            </div>
            <div>
              <span className="font-bold tracking-tight">Lunar Intake Queue</span>
              <span className="ml-2 text-[10px] text-gray-500 uppercase tracking-wider">
                ClerkOS
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <Link href="/portal">
              <button className="text-gray-400 hover:text-white transition-colors">← Portal</button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-6">
        {/* Filters */}
        <div className="flex items-center gap-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Filter by status</p>
          <select
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white outline-none focus:border-[#00D4FF]/50 transition-colors"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Status | '')}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="in_review">In Review</option>
            <option value="matter_created">Matter Created</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-24 gap-3 text-white/40">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading intakes…</span>
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-300">Failed to load intake queue</p>
              <p className="text-xs text-red-400/70 mt-0.5">
                {error?.message ?? 'Unknown error'}
              </p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && data && data.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] py-24 gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
              <Brain className="h-7 w-7 text-gray-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-400">No intakes found</p>
              <p className="mt-1 text-sm text-gray-600">
                {statusFilter
                  ? `No intakes with status "${statusFilter}".`
                  : 'Submit a Lunar Intake form to see results here.'}
              </p>
            </div>
          </div>
        )}

        {/* Table */}
        {!isLoading && !isError && data && data.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#111318] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/40">
                      Client
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/40">
                      Issue Type
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/40">
                      Decision
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/40">
                      Risk
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/40">
                      Urgency
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/40">
                      Status
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/40">
                      Received
                    </th>
                    <th className="px-4 py-3 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <IntakeTableRow
                      key={row.id}
                      row={row as IntakeRow}
                      onStatusChange={handleStatusChange}
                      updating={updatingId === row.id}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-white/5 text-xs text-white/30">
              {data.length} intake{data.length !== 1 ? 's' : ''}
              {statusFilter ? ` · filtered by "${statusFilter}"` : ''}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
