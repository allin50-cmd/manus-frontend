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
    description: 'Get notified when annual accounts are filed'
  },
  {
    key: 'confirmation_statement',
    label: 'Confirmation Statement',
    description: 'Alerts for confirmation statement filings'
  },
  {
    key: 'director_changes',
    label: 'Director Changes',
    description: 'Notifications about director appointments/resignations'
  }
];

export function ActivationPanel({ companyNumber, companyName, onContinue }: ActivationPanelProps) {
  const [selected, setSelected] = useState<Record<AlertKey, boolean>>({
    accounts_filing: true,
    confirmation_statement: true,
    director_changes: true
  });
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const monthlyPrice = selectedCount * 1;

  const toggleAlert = (key: AlertKey) => {
    setSelected(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleActivate = async () => {
    setActivating(true);
    setError(null);
    try {
      const res = await fetch('/api/monitored', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyNumber, companyName }),
      });
      if (res.status === 401) {
        // Not signed in — send the operator to login, returning here after.
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Activation failed. Please try again.');
      }
      setActivated(true);
      onContinue?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Set up alerts</h2>
        <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg border border-gray-200 dark:border-slate-600">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-semibold text-gray-900 dark:text-white">{companyName}</span>
            <br />
            <span className="font-mono text-gray-500 dark:text-gray-400">Company number: {companyNumber}</span>
          </p>
        </div>
      </div>

      <div className="mb-8">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Choose which alerts you want:</p>
        <div className="space-y-3">
          {ALERT_TYPES.map(({ key, label, description }) => (
            <label key={key} className="flex items-start gap-3 p-4 border-2 border-gray-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition">
              <input
                type="checkbox"
                checked={selected[key]}
                onChange={() => toggleAlert(key)}
                className="w-5 h-5 mt-0.5 accent-blue-600"
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{label}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{description}</p>
              </div>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">£1/mo</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Total: {selectedCount} alert{selectedCount !== 1 ? 's' : ''}
          </span>
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">£{monthlyPrice}/month</span>
        </div>
      </div>

      <div className="mb-8 space-y-2 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <span>✓</span>
          <span>No contract required</span>
        </div>
        <div className="flex items-center gap-2">
          <span>✓</span>
          <span>Cancel anytime</span>
        </div>
        <div className="flex items-center gap-2">
          <span>✓</span>
          <span>Instant email & dashboard alerts</span>
        </div>
        <div className="flex items-center gap-2">
          <span>✓</span>
          <span>Avoid fines from £150+</span>
        </div>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      {activated ? (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-center">
          <p className="font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
            ✓ Now monitoring {companyName}
          </p>
          <a href="/company-portal" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            View in your dashboard →
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            onClick={handleActivate}
            disabled={selectedCount === 0 || activating}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition"
          >
            {activating ? 'Activating…' : `Activate Alerts · £${monthlyPrice}/month`}
          </button>
          <button className="w-full bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-900 dark:text-white font-semibold py-3 px-4 rounded-lg transition">
            Start Free Trial
          </button>
        </div>
      )}
    </div>
  );
}
