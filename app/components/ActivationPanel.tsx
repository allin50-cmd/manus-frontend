'use client';

import { useState } from 'react';

type AlertKey = 'accounts_filing' | 'confirmation_statement' | 'director_changes';

interface ActivationPanelProps {
  companyNumber: string;
  companyName: string;
  onContinue?: () => void;
}

const ALERT_TYPES: { key: AlertKey; label: string; description: string }[] = [
  {
    key: 'accounts_filing',
    label: 'Accounts Filing',
    description: 'Alerts before annual accounts are due',
  },
  {
    key: 'confirmation_statement',
    label: 'Confirmation Statement',
    description: 'Alerts before confirmation statement deadline',
  },
  {
    key: 'director_changes',
    label: 'Director Changes',
    description: 'Notifications about director appointments and resignations',
  },
];

export function ActivationPanel({ companyNumber, companyName, onContinue }: ActivationPanelProps) {
  const [selected, setSelected] = useState<Record<AlertKey, boolean>>({
    accounts_filing: true,
    confirmation_statement: true,
    director_changes: true,
  });
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCount = Object.values(selected).filter(Boolean).length;

  const toggleAlert = (key: AlertKey) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleActivate = async () => {
    setActivating(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyNumber, companyName, alertCount: selectedCount }),
      });

      const data = await res.json().catch(() => ({})) as { url?: string; error?: string };

      if (!res.ok || !data.url) {
        throw new Error(
          data.error || 'Payment service is unavailable. Please contact hello@fineguard.co.uk'
        );
      }

      window.location.href = data.url;
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActivating(false);
    }
  };

  if (activated) {
    return (
      <div className="w-full max-w-lg mx-auto p-8 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
        <div className="w-14 h-14 bg-[#E6F7F1] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-[#00A86B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-bold text-slate-900 text-xl mb-1">Now monitoring {companyName}</h3>
        <p className="text-slate-500 text-sm mb-5">You&apos;ll receive alerts before any deadline.</p>
        <a href="/company-portal" className="inline-block bg-[#00A86B] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#009960] transition-colors">
          View dashboard →
        </a>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Company header */}
      <div className="bg-[#0B1F3A] px-6 py-5">
        <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-0.5">Setting up alerts for</p>
        <p className="text-white font-bold text-lg leading-tight">{companyName}</p>
        <p className="text-white/50 text-xs font-mono mt-0.5">{companyNumber}</p>
      </div>

      <div className="p-6">
        {/* Alert selection */}
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-3">Choose your alerts</p>
        <div className="space-y-2 mb-6">
          {ALERT_TYPES.map(({ key, label, description }) => (
            <label
              key={key}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                selected[key]
                  ? 'border-[#00A86B] bg-[#E6F7F1]'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="checkbox"
                checked={selected[key]}
                onChange={() => toggleAlert(key)}
                className="w-4 h-4 mt-0.5 accent-[#00A86B] shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{description}</p>
              </div>
            </label>
          ))}
        </div>

        {/* Price */}
        <div className="bg-[#F7F8FA] rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs">Monthly protection</p>
            <p className="text-slate-400 text-xs mt-0.5">{selectedCount} alert type{selectedCount !== 1 ? 's' : ''} selected</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[#0B1F3A]">£4.99</p>
            <p className="text-slate-400 text-xs">per month</p>
          </div>
        </div>

        {/* Trust */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {['Cancel any time', 'No contracts', 'Email & dashboard alerts', 'Avoid fines from £150+'].map((t) => (
            <div key={t} className="flex items-center gap-1.5 text-xs text-slate-500">
              <svg className="w-3.5 h-3.5 text-[#00A86B] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {t}
            </div>
          ))}
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        <button
          onClick={handleActivate}
          disabled={selectedCount === 0 || activating}
          className="w-full bg-[#00A86B] hover:bg-[#009960] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-xl transition-colors text-base"
        >
          {activating ? 'Activating…' : 'Protect My Company · £4.99/month'}
        </button>
        <p className="text-center text-slate-400 text-xs mt-2">No setup fee. Cancel any time.</p>
      </div>
    </div>
  );
}
