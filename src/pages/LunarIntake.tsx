"use client";
import { useState } from 'react';
import {
  Brain,
  Shield,
  Zap,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Copy,
  Check,
  Scale,
  FileText,
} from 'lucide-react';
import { Link } from 'wouter';

// ── Types ─────────────────────────────────────────────────────────────────────

type Decision = 'ALLOW' | 'MODIFY' | 'DENY' | 'ESCALATE';

interface PipelineResult {
  ok: boolean;
  intakeId: string | null;
  pipeline: {
    step1_lunar: {
      riskScore: number;
      urgency: 'normal' | 'high' | 'critical';
      flags: string[];
      scoreBreakdown: { signal: string; weight: number }[];
    };
    step2_ultracore: {
      decision: Decision;
      reason: string;
      rules: string[];
    };
    step3_vault: {
      hash: string;
      eventType: string;
    };
    step4_lola: {
      message: string;
      callToAction: string;
      tone: string;
      nextStep: string;
    };
  };
}

// ── Decision styling ──────────────────────────────────────────────────────────

const DECISION_STYLES: Record<Decision, { bg: string; border: string; text: string; icon: React.ElementType; label: string }> = {
  ALLOW: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/40',
    text: 'text-emerald-400',
    icon: CheckCircle2,
    label: 'Allowed — proceed to matter creation',
  },
  MODIFY: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/40',
    text: 'text-amber-400',
    icon: AlertTriangle,
    label: 'Modify — solicitor review required',
  },
  DENY: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/40',
    text: 'text-red-400',
    icon: XCircle,
    label: 'Denied — resubmission required',
  },
  ESCALATE: {
    bg: 'bg-red-900/30',
    border: 'border-red-500/60',
    text: 'text-red-300',
    icon: AlertTriangle,
    label: 'Escalated — immediate human review',
  },
};

// ── Pipeline steps ────────────────────────────────────────────────────────────

const PIPELINE_STEPS = [
  { id: 'lunar',     label: 'Lunar Triage',         icon: Brain,        color: '#00D4FF', desc: 'Keyword risk scoring' },
  { id: 'ultracore', label: 'UltraCore Gate',        icon: Zap,          color: '#7C3AED', desc: 'Decision engine' },
  { id: 'vault',     label: 'VaultLine Audit',       icon: Shield,       color: '#10B981', desc: 'SHA-256 hash' },
  { id: 'lola',      label: 'Lola Follow-up',        icon: MessageSquare,color: '#F59E0B', desc: 'Client message' },
  { id: 'matter',    label: 'Matter Status',         icon: Scale,        color: '#EC4899', desc: 'Pipeline complete' },
];

// ── Risk gauge ────────────────────────────────────────────────────────────────

function RiskGauge({ score }: { score: number }) {
  const color = score >= 80 ? '#EF4444' : score >= 50 ? '#F59E0B' : '#22C55E';
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative flex h-20 w-20 items-center justify-center rounded-full"
        style={{ background: `conic-gradient(${color} ${score}%, rgba(255,255,255,0.06) ${score}%)` }}
      >
        <div className="flex h-14 w-14 flex-col items-center justify-center rounded-full bg-[#0B0C10]">
          <span className="text-xl font-bold" style={{ color }}>{score}</span>
          <span className="text-[9px] text-gray-500">/100</span>
        </div>
      </div>
      <span className="text-[10px] text-gray-500">Risk Score</span>
    </div>
  );
}

// ── Copy hash ─────────────────────────────────────────────────────────────────

function CopyHash({ hash }: { hash: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(hash).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-xs text-gray-400 hover:border-[#10B981]/40 hover:text-[#10B981] transition-colors w-full"
    >
      <span className="truncate">{hash}</span>
      {copied ? <Check className="h-3 w-3 shrink-0 text-[#10B981]" /> : <Copy className="h-3 w-3 shrink-0" />}
    </button>
  );
}

// ── Issue types ───────────────────────────────────────────────────────────────

const ISSUE_TYPES = [
  'Employment dispute',
  'Housing / eviction',
  'Family law / divorce',
  'Contract dispute',
  'Criminal defence',
  'Debt / bankruptcy',
  'Immigration',
  'Personal injury',
  'Fraud / financial crime',
  'Discrimination',
  'Intellectual property',
  'Other',
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LunarIntake() {
  const [form, setForm] = useState({ name: '', email: '', issueType: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const runPipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setActiveStep(0);
    setSubmitting(true);

    // Animate through pipeline steps while fetching
    const stepTimers = PIPELINE_STEPS.slice(0, 4).map((_, i) =>
      setTimeout(() => setActiveStep(i), i * 700),
    );

    try {
      const res = await fetch('/api/lunar/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data: PipelineResult = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Server error');
      setActiveStep(4); // final step
      setResult(data);
    } catch (err) {
      stepTimers.forEach(clearTimeout);
      setError(err instanceof Error ? err.message : 'Submission failed');
      setActiveStep(-1);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-[#00D4FF]/50 focus:ring-1 focus:ring-[#00D4FF]/30';

  const decision = result?.pipeline.step2_ultracore.decision;
  const decisionStyle = decision ? DECISION_STYLES[decision] : null;

  return (
    <div className="min-h-screen bg-[#0B0C10] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B0C10]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00D4FF]/10">
              <Brain className="h-5 w-5 text-[#00D4FF]" />
            </div>
            <div>
              <span className="font-bold tracking-tight">Lunar Intake</span>
              <span className="ml-2 text-[10px] text-gray-500 uppercase tracking-wider">ClerkOS Engine v1</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Deterministic
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00D4FF]" />
              Rules-first
            </span>
            <Link href="/portal">
              <button className="text-gray-400 hover:text-white transition-colors">← Portal</button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

          {/* Left — form */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">ClerkOS Lunar Intake</h1>
              <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                Legal intake, risk scoring, audit logging, and marketing follow-up.
                Rules first. AI second.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <form onSubmit={runPipeline} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">Name *</label>
                  <input {...field('name')} required placeholder="Jane Smith" className={inputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">Email *</label>
                  <input {...field('email')} type="email" required placeholder="jane@example.com" className={inputClass} />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">Issue Type *</label>
                <select {...field('issueType')} required className={inputClass + ' appearance-none'}>
                  <option value="">— Select issue type —</option>
                  {ISSUE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">Describe the issue *</label>
                <textarea
                  {...field('description')}
                  required
                  rows={6}
                  placeholder="Describe the legal issue in as much detail as possible. Include any relevant dates, deadlines, court references, parties involved…"
                  className={inputClass + ' resize-none text-xs leading-relaxed'}
                />
                <p className="mt-1 text-[11px] text-gray-600">
                  Lunar scans for keywords: court, fraud, eviction, deadline, etc. to score risk.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#00D4FF] py-3.5 text-sm font-bold text-black hover:bg-[#00bce8] disabled:opacity-50 transition-colors"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Running Lunar Pipeline…</>
                ) : (
                  <><Brain className="h-4 w-4" /> Run Lunar Intake</>
                )}
              </button>
            </form>

            {/* Pipeline legend */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                Pipeline — build order
              </p>
              <div className="space-y-2">
                {PIPELINE_STEPS.map((step, i) => {
                  const done = activeStep > i;
                  const active = activeStep === i;
                  const Icon = step.icon;
                  return (
                    <div key={step.id} className="flex items-center gap-3">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all ${
                          done ? 'bg-emerald-500/20' : active ? 'ring-2 ring-offset-1 ring-offset-[#0B0C10]' : 'bg-white/[0.03]'
                        }`}
                        style={active ? { background: `${step.color}20` } : {}}
                      >
                        {done ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : active ? (
                          <Loader2 className="h-4 w-4 animate-spin" style={{ color: step.color }} />
                        ) : (
                          <Icon className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium transition-colors ${
                          done ? 'text-emerald-400' : active ? 'text-white' : 'text-gray-600'
                        }`}>{step.label}</p>
                        <p className="text-[10px] text-gray-600">{step.desc}</p>
                      </div>
                      {i < PIPELINE_STEPS.length - 1 && (
                        <ArrowRight className={`h-3 w-3 shrink-0 ${done ? 'text-emerald-400' : 'text-gray-700'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right — results */}
          <div className="space-y-4">
            {!result ? (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                  <Scale className="h-8 w-8 text-gray-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-400">Pipeline results will appear here</p>
                  <p className="mt-1 text-sm text-gray-600">Submit a client intake to see Lunar triage, UltraCore decision, VaultLine hash, and Lola's follow-up.</p>
                </div>
              </div>
            ) : (
              <>
                {/* ── Decision banner ── */}
                {decisionStyle && (
                  <div className={`rounded-2xl border ${decisionStyle.border} ${decisionStyle.bg} p-5`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <decisionStyle.icon className={`h-6 w-6 ${decisionStyle.text}`} />
                        <div>
                          <p className={`text-xl font-bold ${decisionStyle.text}`}>{decision}</p>
                          <p className={`text-xs ${decisionStyle.text} opacity-80`}>{decisionStyle.label}</p>
                        </div>
                      </div>
                      <RiskGauge score={result.pipeline.step1_lunar.riskScore} />
                    </div>
                    <p className="mt-3 text-sm text-gray-300 border-t border-white/10 pt-3">
                      {result.pipeline.step2_ultracore.reason}
                    </p>
                  </div>
                )}

                {/* ── Step 1: Lunar ── */}
                <div className="rounded-2xl border border-[#00D4FF]/20 bg-[#00D4FF]/[0.03] p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-[#00D4FF]" />
                    <p className="text-sm font-semibold text-gray-300">Step 1 — Lunar Triage</p>
                    <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      result.pipeline.step1_lunar.urgency === 'critical' ? 'bg-red-500/20 text-red-400' :
                      result.pipeline.step1_lunar.urgency === 'high' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {result.pipeline.step1_lunar.urgency.toUpperCase()}
                    </span>
                  </div>
                  {result.pipeline.step1_lunar.flags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {result.pipeline.step1_lunar.flags.map((flag) => {
                        const w = result.pipeline.step1_lunar.scoreBreakdown.find((s) => s.signal === flag)?.weight ?? 0;
                        return (
                          <span key={flag} className="rounded-full border border-[#00D4FF]/20 bg-[#00D4FF]/10 px-2 py-0.5 text-[10px] font-medium text-[#00D4FF]">
                            {flag} <span className="opacity-60">+{w}</span>
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">No risk keywords detected — base score: 20</p>
                  )}
                </div>

                {/* ── Step 2: UltraCore rules ── */}
                <div className="rounded-2xl border border-[#7C3AED]/20 bg-[#7C3AED]/[0.03] p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-[#7C3AED]" />
                    <p className="text-sm font-semibold text-gray-300">Step 2 — UltraCore Gate</p>
                  </div>
                  <div className="space-y-1">
                    {result.pipeline.step2_ultracore.rules.map((rule, i) => (
                      <p key={i} className="font-mono text-[10px] text-gray-500">{rule}</p>
                    ))}
                  </div>
                </div>

                {/* ── Step 3: VaultLine hash ── */}
                <div className="rounded-2xl border border-[#10B981]/20 bg-[#10B981]/[0.03] p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[#10B981]" />
                    <p className="text-sm font-semibold text-gray-300">Step 3 — VaultLine Audit</p>
                    {result.intakeId && (
                      <span className="ml-auto text-[10px] text-emerald-400">Persisted ✓</span>
                    )}
                  </div>
                  <CopyHash hash={result.pipeline.step3_vault.hash} />
                  <p className="text-[10px] text-gray-600">SHA-256 · tamper-evident · append-only</p>
                </div>

                {/* ── Step 4: Lola ── */}
                <div className="rounded-2xl border border-[#F59E0B]/20 bg-[#F59E0B]/[0.03] p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-[#F59E0B]" />
                    <p className="text-sm font-semibold text-gray-300">Step 4 — Lola Follow-up</p>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{result.pipeline.step4_lola.message}</p>
                  <div className="flex items-center gap-2 rounded-lg bg-[#F59E0B]/10 px-3 py-2">
                    <ArrowRight className="h-3 w-3 text-[#F59E0B]" />
                    <p className="text-xs text-[#F59E0B]">{result.pipeline.step4_lola.nextStep}</p>
                  </div>
                </div>

                {/* ── Step 5: Matter CTA ── */}
                {(decision === 'ALLOW' || decision === 'MODIFY') && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-semibold text-white">Create ClerkOS Matter</p>
                        <p className="text-xs text-gray-500">Open this intake as a managed case</p>
                      </div>
                    </div>
                    <Link href="/cases">
                      <button className="shrink-0 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors flex items-center gap-2">
                        Go to Cases <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </Link>
                  </div>
                )}

                {/* ── Run another ── */}
                <button
                  onClick={() => { setResult(null); setActiveStep(-1); }}
                  className="w-full rounded-xl border border-white/10 py-2.5 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Run another intake
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
