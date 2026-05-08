import { useEffect, useState } from 'react';
import { Link, useParams } from 'wouter';
import {
  Brain,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  Shield,
  FileText,
  ChevronRight,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// ── Types ────────────────────────────────────────────────────────────────────

interface RiskFlag {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  clause: string;
  recommendation: string;
}

interface Obligation {
  party: string;
  description: string;
  dueDate: string | null;
  recurring: boolean;
  consequence: string | null;
}

interface KeyDate {
  label: string;
  date: string;
  description: string;
}

interface AnalysisResult {
  metadata: {
    contractType: string;
    parties: string[];
    effectiveDate: string | null;
    jurisdiction: string | null;
    governingLaw: string | null;
    termLength: string | null;
  };
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFlags: RiskFlag[];
  obligations: Obligation[];
  keyDates: KeyDate[];
  summary: string;
  recommendations: string[];
}

interface AnalysisRecord {
  id: string;
  fileName: string;
  status: 'processing' | 'complete' | 'failed';
  result?: AnalysisResult;
  error?: string;
  createdAt: string;
  completedAt?: string;
  agentLog: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'border-red-500/40 bg-red-500/10 text-red-400',
  high: 'border-orange-500/40 bg-orange-500/10 text-orange-400',
  medium: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  low: 'border-green-500/40 bg-green-500/10 text-green-400',
};

const SEVERITY_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-400',
  low: 'bg-green-500',
};

function scoreColor(score: number) {
  if (score >= 70) return '#EF4444';
  if (score >= 40) return '#F59E0B';
  return '#22C55E';
}

function riskLevelLabel(level: string) {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

// ── Processing state ─────────────────────────────────────────────────────────

const PROCESSING_MSGS = [
  'UltAi agent is running…',
  'Extracting metadata & parties…',
  'Scanning risk clauses…',
  'Mapping obligations…',
  'Calculating risk score…',
];

function ProcessingState({ agentLog }: { agentLog: string[] }) {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setMsgIdx((i) => Math.min(i + 1, PROCESSING_MSGS.length - 1)),
      3000,
    );
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00D4FF]/20" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00D4FF]/10 border border-[#00D4FF]/30">
          <Brain className="h-8 w-8 text-[#00D4FF]" />
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">Agent Processing</h2>
        <p className="mt-1 text-sm text-[#00D4FF] animate-pulse">{PROCESSING_MSGS[msgIdx]}</p>
      </div>
      {agentLog.length > 0 && (
        <div className="w-full max-w-sm rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-1">
          {agentLog.map((line, i) => (
            <p key={i} className="text-xs text-gray-500 font-mono">
              {line}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Full result ───────────────────────────────────────────────────────────────

function FullResult({ record }: { record: AnalysisRecord }) {
  const r = record.result!;
  const score = r.riskScore;
  const col = scoreColor(score);

  return (
    <div className="space-y-6">
      {/* ── Header card ── */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-gray-500 shrink-0" />
              <h1 className="text-lg font-bold text-white truncate">{record.fileName}</h1>
            </div>
            <p className="text-sm text-gray-400">{r.metadata.contractType}</p>
            {record.completedAt && (
              <p className="text-xs text-gray-600 mt-1">
                Analysed{' '}
                {new Date(record.completedAt).toLocaleString('en-GB', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            )}
          </div>

          {/* Risk score ring */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div
              className="relative flex h-20 w-20 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(${col} ${score}%, rgba(255,255,255,0.06) ${score}%)`,
              }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0B0C10]">
                <span className="text-xl font-bold" style={{ color: col }}>
                  {score}
                </span>
              </div>
            </div>
            <Badge className={`text-xs px-2 py-0.5 ${SEVERITY_STYLES[r.riskLevel]}`}>
              {riskLevelLabel(r.riskLevel)} Risk
            </Badge>
          </div>
        </div>

        {/* Summary */}
        <p className="mt-4 text-sm text-gray-300 leading-relaxed border-t border-white/10 pt-4">
          {r.summary}
        </p>
      </div>

      {/* ── Metadata ── */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-300">Contract Details</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">Parties</p>
            <div className="mt-1 space-y-0.5">
              {r.metadata.parties.map((p, i) => (
                <p key={i} className="text-sm text-white">
                  {p}
                </p>
              ))}
            </div>
          </div>
          {r.metadata.effectiveDate && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">Effective Date</p>
              <p className="mt-1 text-sm text-white">{r.metadata.effectiveDate}</p>
            </div>
          )}
          {r.metadata.jurisdiction && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">Jurisdiction</p>
              <p className="mt-1 text-sm text-white">{r.metadata.jurisdiction}</p>
            </div>
          )}
          {r.metadata.governingLaw && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">Governing Law</p>
              <p className="mt-1 text-sm text-white">{r.metadata.governingLaw}</p>
            </div>
          )}
          {r.metadata.termLength && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">Term</p>
              <p className="mt-1 text-sm text-white">{r.metadata.termLength}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Recommendations ── */}
      {r.recommendations.length > 0 && (
        <div className="rounded-2xl border border-[#00D4FF]/20 bg-[#00D4FF]/[0.03] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-4 w-4 text-[#00D4FF]" />
            <h2 className="text-sm font-semibold text-gray-300">UltAi Recommendations</h2>
          </div>
          <ol className="space-y-2">
            {r.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-[#00D4FF]/20 text-[#00D4FF] text-[10px] font-bold mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-300">{rec}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ── Risk Flags ── */}
      {r.riskFlags.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-gray-300">
                Risk Flags ({r.riskFlags.length})
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {(['critical', 'high', 'medium', 'low'] as const).map((s) => {
                const count = r.riskFlags.filter((f) => f.severity === s).length;
                if (!count) return null;
                return (
                  <span key={s} className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${SEVERITY_STYLES[s]}`}>
                    {count} {s}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="space-y-3">
            {r.riskFlags
              .sort((a, b) => {
                const order = { critical: 0, high: 1, medium: 2, low: 3 };
                return order[a.severity] - order[b.severity];
              })
              .map((flag, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${SEVERITY_DOT[flag.severity]}`} />
                      <span className="text-sm font-medium text-white">{flag.category}</span>
                    </div>
                    <Badge className={`text-[10px] shrink-0 ${SEVERITY_STYLES[flag.severity]}`}>
                      {flag.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-300">{flag.description}</p>
                  {flag.clause && (
                    <blockquote className="border-l-2 border-white/10 pl-3 text-xs text-gray-500 italic leading-relaxed">
                      {flag.clause}
                    </blockquote>
                  )}
                  <div className="flex items-start gap-2 rounded-lg bg-[#00D4FF]/5 border border-[#00D4FF]/10 px-3 py-2">
                    <ChevronRight className="h-3.5 w-3.5 text-[#00D4FF] mt-0.5 shrink-0" />
                    <p className="text-xs text-[#00D4FF]">{flag.recommendation}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Obligations ── */}
      {r.obligations.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4 text-[#7C3AED]" />
            <h2 className="text-sm font-semibold text-gray-300">
              Obligations ({r.obligations.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {['Party', 'Obligation', 'Due', 'Recurring', 'Consequence'].map((h) => (
                    <th
                      key={h}
                      className="pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {r.obligations.map((ob, i) => (
                  <tr key={i} className="group hover:bg-white/[0.02]">
                    <td className="py-3 pr-4 text-[#00D4FF] font-medium whitespace-nowrap">
                      {ob.party}
                    </td>
                    <td className="py-3 pr-4 text-gray-300 max-w-xs">{ob.description}</td>
                    <td className="py-3 pr-4 text-gray-400 whitespace-nowrap text-xs">
                      {ob.dueDate ?? '—'}
                    </td>
                    <td className="py-3 pr-4">
                      {ob.recurring ? (
                        <span className="flex items-center gap-1 text-xs text-purple-400">
                          <RefreshCw className="h-3 w-3" /> Yes
                        </span>
                      ) : (
                        <span className="text-xs text-gray-600">One-off</span>
                      )}
                    </td>
                    <td className="py-3 text-xs text-gray-500 max-w-[160px]">
                      {ob.consequence ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Key Dates ── */}
      {r.keyDates.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-[#00D4FF]" />
            <h2 className="text-sm font-semibold text-gray-300">Key Dates</h2>
          </div>
          <div className="space-y-2">
            {r.keyDates.map((kd, i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#00D4FF]/10">
                  <Calendar className="h-4 w-4 text-[#00D4FF]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{kd.label}</p>
                  <p className="text-xs text-[#00D4FF]">{kd.date}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{kd.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Link href="/ultai-dashboard">
          <button className="flex items-center gap-2 rounded-xl border border-white/10 px-5 py-2.5 text-sm text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </button>
        </Link>
        <Link href="/ultai-intake">
          <button className="flex items-center gap-2 rounded-xl bg-[#00D4FF] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[#00bce8] transition-colors">
            <Brain className="h-4 w-4" /> Analyse Another
          </button>
        </Link>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UltAiResult() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [record, setRecord] = useState<AnalysisRecord | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/ultai/analyses/${id}`);
        if (res.status === 404) { setNotFound(true); return; }
        const data: AnalysisRecord = await res.json();
        setRecord(data);
        if (data.status === 'processing') {
          setTimeout(poll, 2500);
        }
      } catch {
        setTimeout(poll, 3000);
      }
    };

    poll();
  }, [id]);

  return (
    <div className="min-h-screen bg-[#0B0C10] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B0C10]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-3">
          <Link href="/ultai-dashboard">
            <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </button>
          </Link>
          <div className="flex items-center gap-2 ml-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00D4FF]/10">
              <Brain className="h-4 w-4 text-[#00D4FF]" />
            </div>
            <span className="font-bold tracking-tight">UltAi</span>
          </div>
          <span className="ml-auto text-xs text-gray-500">Analysis Report</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {notFound ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <AlertCircle className="h-10 w-10 text-red-400" />
            <p className="text-white font-semibold">Analysis not found</p>
            <Link href="/ultai-intake">
              <button className="rounded-xl bg-[#00D4FF] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[#00bce8]">
                Start New Analysis
              </button>
            </Link>
          </div>
        ) : !record ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-[#00D4FF] animate-spin" />
          </div>
        ) : record.status === 'processing' ? (
          <ProcessingState agentLog={record.agentLog} />
        ) : record.status === 'failed' ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <AlertCircle className="h-10 w-10 text-red-400" />
            <div className="text-center">
              <p className="text-white font-semibold">Analysis failed</p>
              <p className="text-sm text-gray-400 mt-1">{record.error}</p>
              {record.error?.includes('ANTHROPIC_API_KEY') && (
                <p className="text-xs text-gray-600 mt-2">
                  Set the <code className="text-[#00D4FF]">ANTHROPIC_API_KEY</code> environment
                  variable on the server to enable contract analysis.
                </p>
              )}
            </div>
            <Link href="/ultai-intake">
              <button className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-gray-400 hover:text-white transition-colors">
                Try Again
              </button>
            </Link>
          </div>
        ) : (
          <FullResult record={record} />
        )}
      </main>
    </div>
  );
}
