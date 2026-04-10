'use client';

import { useCompanyStore } from '@/lib/stores/company-store';
import { ALERT_LABELS, ALERT_DESCRIPTIONS, type AlertType } from '@/types/alerts';
import { formatPence } from '@/lib/utils/currency';
import { CheckSquare, Square } from 'lucide-react';
import Link from 'next/link';

const ALL_SERVICES: AlertType[] = ['accounts_filing', 'confirmation_statement', 'strike_off'];

export function ActivationPanel() {
  const { selectedServices, toggleService, totalMonthly } = useCompanyStore();

  return (
    <div className="rounded-xl border bg-white shadow-sm p-5 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Choose Your Protection</h3>
        <p className="text-sm text-slate-500 mt-0.5">Select the services you want to monitor.</p>
      </div>

      <div className="space-y-3">
        {ALL_SERVICES.map((type) => {
          const selected = selectedServices.includes(type);
          return (
            <button
              key={type}
              onClick={() => toggleService(type)}
              className={`w-full flex items-start gap-3 p-4 rounded-lg border text-left transition-colors ${
                selected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {selected
                ? <CheckSquare className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                : <Square className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">{ALERT_LABELS[type]}</p>
                <p className="text-xs text-slate-500 mt-0.5">{ALERT_DESCRIPTIONS[type]}</p>
              </div>
              <span className="text-sm font-semibold text-slate-700 shrink-0">£1/month</span>
            </button>
          );
        })}
      </div>

      {selectedServices.length > 0 && (
        <div className="border-t pt-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">Monthly total</p>
            <p className="text-xl font-bold text-slate-900">{formatPence(totalMonthly())}/mo</p>
          </div>
          <div className="text-right">
            <Link
              href="/checkout"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Start monitoring
            </Link>
            <p className="text-xs text-slate-400 mt-1.5">Takes around 30 seconds</p>
          </div>
        </div>
      )}
    </div>
  );
}
