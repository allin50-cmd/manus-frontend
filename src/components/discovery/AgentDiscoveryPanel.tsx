'use client';

import { useState, useEffect } from 'react';
import {
  Users, ShieldCheck, ShieldAlert, ShieldX, Shield,
  AlertTriangle, CheckCircle, TrendingUp, Loader2,
  Building2, ChevronDown, ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgentDiscovery, ViabilityTier } from '@/types/discovery';

// ── Viability tier config ─────────────────────────────────────────────────────

const tierConfig: Record<ViabilityTier, {
  label: string;
  bar: string;
  text: string;
  bg: string;
  border: string;
  icon: typeof ShieldCheck;
}> = {
  excellent: {
    label: 'Excellent',
    bar: 'bg-emerald-500',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: ShieldCheck,
  },
  strong: {
    label: 'Strong',
    bar: 'bg-green-500',
    text: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: ShieldCheck,
  },
  moderate: {
    label: 'Moderate',
    bar: 'bg-amber-400',
    text: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: ShieldAlert,
  },
  weak: {
    label: 'Weak',
    bar: 'bg-orange-500',
    text: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    icon: ShieldAlert,
  },
  poor: {
    label: 'Poor',
    bar: 'bg-red-500',
    text: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: ShieldX,
  },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function ViabilityMeter({ score, tier }: { score: number; tier: ViabilityTier }) {
  const t = tierConfig[tier];
  const Icon = t.icon;
  return (
    <div className={cn('rounded-xl border p-4', t.bg, t.border)}>
      <div className="flex items-center gap-3 mb-3">
        <Icon className={cn('w-5 h-5', t.text)} />
        <div>
          <p className="text-sm font-semibold text-slate-900">Business Viability</p>
          <p className={cn('text-xs font-medium', t.text)}>{t.label} — {score}/100</p>
        </div>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', t.bar)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children, className }: {
  title: string;
  icon: typeof Users;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white', className)}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
        <Icon className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

interface Props {
  companyNumber: string;
}

export function AgentDiscoveryPanel({ companyNumber }: Props) {
  const [data, setData] = useState<AgentDiscovery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);

    fetch(`/api/discovery?q=${encodeURIComponent(companyNumber)}`)
      .then((r) => r.json())
      .then((json: AgentDiscovery & { error?: string }) => {
        if (cancelled) return;
        if (json.error) {
          setError(json.error);
        } else {
          setData(json);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Discovery data unavailable');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [companyNumber]);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 flex items-center gap-3 text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        <span className="text-sm">Loading agent discovery…</span>
      </div>
    );
  }

  if (error || !data) return null;

  const activeOfficers = data.officers.filter((o) => !o.resignedOn);
  const activePSC = data.personsWithSignificantControl.filter((p) => !p.ceasedOn);
  const outstandingCharges = data.charges.filter(
    (c) => c.status === 'outstanding' || c.status === 'registered',
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
      >
        <TrendingUp className="w-4 h-4 text-blue-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">Agent Discovery</p>
          <p className="text-xs text-slate-500">Who &amp; how to do business — viability {data.viability.tier}</p>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-slate-100 p-4 space-y-4">
          {/* Viability meter */}
          <ViabilityMeter score={data.viability.score} tier={data.viability.tier} />

          {/* AI insights */}
          {data.insights && (
            <>
              {/* Viability summary */}
              <div className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-3 border border-slate-200">
                {data.insights.viabilitySummary}
              </div>

              {/* Who to contact */}
              {data.insights.whoToContact.length > 0 && (
                <Section title="Who to Contact" icon={Users}>
                  <ul className="space-y-3">
                    {data.insights.whoToContact.map((contact, i) => (
                      <li key={i} className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-xs font-bold text-blue-700">
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900">{contact.name}</p>
                          <p className="text-xs text-slate-500 capitalize">{contact.role}</p>
                          <p className="text-xs text-slate-600 mt-0.5">{contact.context}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* How to engage */}
              <Section title="How to Engage" icon={Building2}>
                <p className="text-sm text-slate-700 leading-relaxed">{data.insights.howToEngage}</p>
              </Section>

              {/* Signals */}
              {(data.insights.strengthSignals.length > 0 || data.insights.redFlags.length > 0) && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {data.insights.strengthSignals.length > 0 && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                      <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Strengths
                      </p>
                      <ul className="space-y-1">
                        {data.insights.strengthSignals.map((s, i) => (
                          <li key={i} className="text-xs text-green-800">• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {data.insights.redFlags.length > 0 && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                      <p className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Red Flags
                      </p>
                      <ul className="space-y-1">
                        {data.insights.redFlags.map((f, i) => (
                          <li key={i} className="text-xs text-red-800">• {f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Viability factors (always shown) */}
          <Section title="Viability Factors" icon={Shield}>
            <ul className="space-y-1">
              {data.viability.factors.map((f, i) => (
                <li key={i} className="text-xs text-slate-600 flex gap-2">
                  <span className="text-slate-300 shrink-0">•</span>
                  {f}
                </li>
              ))}
            </ul>
          </Section>

          {/* Officers + PSC + Charges — compact tables */}
          {activeOfficers.length > 0 && (
            <Section title={`Officers (${activeOfficers.length} active)`} icon={Users}>
              <ul className="space-y-1.5">
                {activeOfficers.slice(0, 6).map((o, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="font-medium text-slate-800 truncate">{o.name}</span>
                    <span className="text-slate-400 capitalize shrink-0">{o.role}</span>
                  </li>
                ))}
                {activeOfficers.length > 6 && (
                  <li className="text-xs text-slate-400">+{activeOfficers.length - 6} more</li>
                )}
              </ul>
            </Section>
          )}

          {activePSC.length > 0 && (
            <Section title={`Beneficial Owners (${activePSC.length})`} icon={ShieldCheck}>
              <ul className="space-y-1.5">
                {activePSC.map((p, i) => (
                  <li key={i} className="text-xs text-slate-700">
                    <span className="font-medium">{p.name}</span>
                    {p.nationality && <span className="text-slate-400"> — {p.nationality}</span>}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {outstandingCharges.length > 0 && (
            <Section title={`Charges (${outstandingCharges.length} outstanding)`} icon={AlertTriangle}>
              <ul className="space-y-1.5">
                {outstandingCharges.slice(0, 4).map((c, i) => (
                  <li key={i} className="text-xs text-slate-700">
                    <span className="font-medium">{c.chargeCode}</span>
                    {c.description && <span className="text-slate-500"> — {c.description}</span>}
                    <span className="text-slate-400"> ({c.createdOn})</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <p className="text-xs text-slate-400 text-right">
            Live data · {new Date(data.generatedAt).toLocaleTimeString('en-GB')}
          </p>
        </div>
      )}
    </div>
  );
}
