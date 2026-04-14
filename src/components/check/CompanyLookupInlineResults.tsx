'use client';

import type { Company } from '@/types/company';
import { CompanyResultCard } from './CompanyResultCard';
import { DeadlineStatusCard } from './DeadlineStatusCard';
import { ActivationPanel } from './ActivationPanel';
import { AgentDiscoveryPanel } from '@/components/discovery/AgentDiscoveryPanel';
import { AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  loading: boolean;
  error?: string;
  company?: Company;
}

export function CompanyLookupInlineResults({ loading, error, company }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Looking up company…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!company) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">You have upcoming compliance deadlines</h2>

      <CompanyResultCard company={company} />
      <AgentDiscoveryPanel companyNumber={company.number} />
      <DeadlineStatusCard company={company} />

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-1">
        <p className="text-sm font-semibold text-slate-900">If missed:</p>
        <ul className="text-sm text-slate-700 space-y-1 mt-1">
          <li>Late filing penalties can rise from £150 to £1,500+</li>
          <li>Repeated failures increase risk of further enforcement</li>
          <li>Important filings can affect business credibility</li>
        </ul>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1">
        <p className="text-sm font-semibold text-slate-900">Without monitoring:</p>
        <ul className="text-sm text-slate-600 space-y-1 mt-1">
          <li>Deadlines get buried in day-to-day work</li>
          <li>Reminders are missed</li>
          <li>Penalties arrive too late to avoid</li>
        </ul>
      </div>

      <ActivationPanel />
    </div>
  );
}
