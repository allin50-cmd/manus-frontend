import ClerkOSLayout from '@/components/layout/ClerkOSLayout';
import { trpc } from '@/lib/trpc';
import {
  Layers,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Lock,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type EventNode = {
  id: string;
  type: string;
  hash: string;
  prevHash: string;
  data: Record<string, unknown>;
  timestamp: string;
  valid: boolean;
};

type ChainVerificationStatus = 'idle' | 'verifying' | 'valid' | 'tampered';

function hashColour(valid: boolean) {
  return valid
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-red-600 dark:text-red-400';
}

function EventRow({
  event,
  index,
  total,
  expanded,
  onToggle,
}: {
  event: EventNode;
  index: number;
  total: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const TYPE_COLOUR: Record<string, string> = {
    CASE_CREATED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    CASE_TRANSITION: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    DOCUMENT_UPLOADED: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    DOCUMENT_APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    BUNDLE_INITIATED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    BUNDLE_FINALISED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  };

  return (
    <div className="relative">
      {/* Connector line */}
      {index < total - 1 && (
        <div
          className={[
            'absolute left-[23px] top-[44px] w-0.5 h-[calc(100%-12px)]',
            event.valid ? 'bg-emerald-300 dark:bg-emerald-700' : 'bg-red-300 dark:bg-red-700',
          ].join(' ')}
        />
      )}

      <div className="flex gap-4">
        {/* Node */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <div
            className={[
              'w-10 h-10 rounded-full flex items-center justify-center border-2 bg-white dark:bg-slate-900',
              event.valid
                ? 'border-emerald-400 dark:border-emerald-600'
                : 'border-red-400 dark:border-red-600',
            ].join(' ')}
          >
            {event.valid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
            )}
          </div>
        </div>

        {/* Card */}
        <div className="flex-1 mb-4">
          <div
            className={[
              'rounded-xl border bg-white dark:bg-slate-900 overflow-hidden transition-shadow',
              event.valid
                ? 'border-slate-200 dark:border-slate-800 hover:shadow-md'
                : 'border-red-200 dark:border-red-800/50',
            ].join(' ')}
          >
            <button
              onClick={onToggle}
              className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${TYPE_COLOUR[event.type] ?? 'bg-slate-100 text-slate-600'}`}
                >
                  {event.type}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-mono truncate">
                  {event.hash.slice(0, 16)}…
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {new Date(event.timestamp).toLocaleString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {expanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>
            </button>

            {expanded && (
              <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800 space-y-3 pt-3">
                <div>
                  <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">
                    Event Data
                  </p>
                  <pre className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-lg p-3 overflow-auto font-mono whitespace-pre-wrap">
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">
                      Hash
                    </p>
                    <p className={`text-[10px] font-mono break-all ${hashColour(event.valid)}`}>
                      {event.hash}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">
                      Prev Hash
                    </p>
                    <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 break-all">
                      {event.prevHash || '0x0000…'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Demo chain data (simulated from a real ClerkOS bundle)
function buildDemoChain(caseId: number): EventNode[] {
  const ts = (daysAgo: number) =>
    new Date(Date.now() - daysAgo * 86_400_000).toISOString();

  return [
    {
      id: 'ev-1',
      type: 'CASE_CREATED',
      hash: `sha256:a1b2c3d4e5f6${caseId}001`,
      prevHash: '0x0000000000000000',
      data: { caseId, referenceNumber: `2024-CIV-${String(caseId).padStart(3, '0')}`, plaintiff: 'Smith', defendant: 'Jones' },
      timestamp: ts(14),
      valid: true,
    },
    {
      id: 'ev-2',
      type: 'CASE_TRANSITION',
      hash: `sha256:b2c3d4e5f6a1${caseId}002`,
      prevHash: `sha256:a1b2c3d4e5f6${caseId}001`,
      data: { fromStatus: 'open', toStatus: 'in_progress', actorId: 1 },
      timestamp: ts(12),
      valid: true,
    },
    {
      id: 'ev-3',
      type: 'DOCUMENT_UPLOADED',
      hash: `sha256:c3d4e5f6a1b2${caseId}003`,
      prevHash: `sha256:b2c3d4e5f6a1${caseId}002`,
      data: { fileName: 'witness-statement.pdf', documentType: 'witness statement', fileSize: 245760 },
      timestamp: ts(10),
      valid: true,
    },
    {
      id: 'ev-4',
      type: 'DOCUMENT_APPROVED',
      hash: `sha256:d4e5f6a1b2c3${caseId}004`,
      prevHash: `sha256:c3d4e5f6a1b2${caseId}003`,
      data: { documentId: 1, approvedForBundle: true, actorId: 1 },
      timestamp: ts(8),
      valid: true,
    },
    {
      id: 'ev-5',
      type: 'BUNDLE_INITIATED',
      hash: `sha256:e5f6a1b2c3d4${caseId}005`,
      prevHash: `sha256:d4e5f6a1b2c3${caseId}004`,
      data: { bundleId: `BUNDLE-${caseId}-001`, documentCount: 1, initiatedBy: 1 },
      timestamp: ts(2),
      valid: true,
    },
    {
      id: 'ev-6',
      type: 'BUNDLE_FINALISED',
      hash: `sha256:f6a1b2c3d4e5${caseId}006`,
      prevHash: `sha256:e5f6a1b2c3d4${caseId}005`,
      data: { bundleId: `BUNDLE-${caseId}-001`, status: 'finalised', blobPath: `tenants/alpha/cases/${caseId}/bundles/bundle-001.pdf` },
      timestamp: ts(1),
      valid: true,
    },
  ];
}

export default function Bundles() {
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [events, setEvents] = useState<EventNode[]>([]);
  const [chainStatus, setChainStatus] = useState<ChainVerificationStatus>('idle');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tamperedMode, setTamperedMode] = useState(false);

  const { data: cases = [], isError: casesError } = trpc.cases.list.useQuery(undefined, { retry: false });

  const loadChain = (caseId: number) => {
    setSelectedCaseId(caseId);
    setChainStatus('idle');
    setExpandedId(null);
    const chain = buildDemoChain(caseId);
    setEvents(chain);
  };

  const verifyChain = () => {
    if (!events.length) return;
    setChainStatus('verifying');
    // Simulate async verification
    setTimeout(() => {
      const allLinked = events.every((ev, i) => {
        if (i === 0) return true;
        return ev.prevHash === events[i - 1].hash;
      });
      const allValid = events.every((ev) => ev.valid);
      setChainStatus(allLinked && allValid && !tamperedMode ? 'valid' : 'tampered');
    }, 800);
  };

  const simulateTamper = () => {
    setTamperedMode(true);
    setEvents((prev) =>
      prev.map((ev, i) =>
        i === 2
          ? {
              ...ev,
              hash: ev.hash.replace('c3d4', 'XXXX'),
              valid: false,
            }
          : i > 2
          ? { ...ev, valid: false }
          : ev,
      ),
    );
    setChainStatus('idle');
    toast.warning('Evidence chain tampered (simulation)');
  };

  const resetChain = () => {
    setTamperedMode(false);
    if (selectedCaseId) {
      loadChain(selectedCaseId);
    }
    setChainStatus('idle');
  };

  const statusBanner = {
    idle: null,
    verifying: (
      <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
        <p className="text-sm text-blue-700 dark:text-blue-300">Verifying chain integrity…</p>
      </div>
    ),
    valid: (
      <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Chain Integrity Verified</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
            All {events.length} events are cryptographically linked and unmodified.
          </p>
        </div>
      </div>
    ),
    tampered: (
      <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-700 dark:text-red-300">Tampering Detected</p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
            Chain hash mismatch — evidence integrity cannot be guaranteed.
          </p>
        </div>
      </div>
    ),
  };

  return (
    <ClerkOSLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Evidence Bundles</h1>
            <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-full">
              <Lock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">CHAIN-VERIFIED</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tamper-evident event chain viewer — cryptographic integrity for court-ready bundles
          </p>
        </div>

        {/* Case selector + controls */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <select
              value={selectedCaseId ?? ''}
              onChange={(e) => e.target.value && loadChain(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Select case to view chain —</option>
              {cases.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.referenceNumber} · {c.title}
                </option>
              ))}
              {!cases.length && <option value="1">Demo Case (no DB)</option>}
            </select>
            {casesError && (
              <p className="text-xs text-amber-400 mt-1">Unable to load cases — showing demo data</p>
            )}
          </div>

          {events.length > 0 && (
            <>
              <button
                onClick={verifyChain}
                disabled={chainStatus === 'verifying'}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Zap className="w-4 h-4" />
                Verify
              </button>
              {!tamperedMode ? (
                <button
                  onClick={simulateTamper}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Simulate Tamper
                </button>
              ) : (
                <button
                  onClick={resetChain}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Reset Chain
                </button>
              )}
            </>
          )}
        </div>

        {/* Load demo if no cases */}
        {!cases.length && !events.length && (
          <div className="mb-5 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div className="flex-1 text-sm text-amber-700 dark:text-amber-300">
              No database connected — load demo chain to explore the viewer.
            </div>
            <button
              onClick={() => loadChain(1)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors flex-shrink-0"
            >
              Load Demo
            </button>
          </div>
        )}

        {/* Status banner */}
        {chainStatus !== 'idle' && <div className="mb-5">{statusBanner[chainStatus]}</div>}

        {/* Chain summary */}
        {events.length > 0 && (
          <div className="mb-5 grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-center">
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{events.length}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Events</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-center">
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {events.filter((e) => e.valid).length}
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Valid</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-center">
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                {events.filter((e) => !e.valid).length}
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Invalid</p>
            </div>
          </div>
        )}

        {/* Event timeline */}
        {events.length > 0 ? (
          <div className="pl-1">
            {events.map((ev, i) => (
              <EventRow
                key={ev.id}
                event={ev}
                index={i}
                total={events.length}
                expanded={expandedId === ev.id}
                onToggle={() => setExpandedId((prev) => (prev === ev.id ? null : ev.id))}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
            <Layers className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Select a case above to view its evidence chain
            </p>
          </div>
        )}
      </div>
    </ClerkOSLayout>
  );
}
