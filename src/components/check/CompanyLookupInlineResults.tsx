'use client';

import type { Company } from '@/types/company';
import { CompanyResultCard } from './CompanyResultCard';
import { DeadlineStatusCard } from './DeadlineStatusCard';
import { ActivationPanel } from './ActivationPanel';
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
      <CompanyResultCard company={company} />
      <DeadlineStatusCard company={company} />
      <ActivationPanel />
    </div>
  );
}
