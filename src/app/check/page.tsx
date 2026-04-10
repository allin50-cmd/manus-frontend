'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCompanyStore } from '@/lib/stores/company-store';
import { CompanyLookupForm } from '@/components/check/CompanyLookupForm';
import { CompanyLookupInlineResults } from '@/components/check/CompanyLookupInlineResults';
import { StickyMobileCTA } from '@/components/check/StickyMobileCTA';
import { PageContainer } from '@/components/shared/PageContainer';
import type { Company } from '@/types/company';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

function CheckPageInner() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [company, setCompany] = useState<Company | undefined>();
  const { setCompany: storeSetCompany, setActivated, activated } = useCompanyStore();

  // Handle Stripe return ?activated=1&company=X
  useEffect(() => {
    const isActivated = searchParams?.get('activated') === '1';
    const companyParam = searchParams?.get('company');
    if (isActivated && companyParam) {
      setActivated(true);
      toast.success('Protection activated — your company is now being monitored.');
    }
  }, [searchParams, setActivated]);

  function handleResult(data: { company?: unknown; results?: unknown[]; error?: string }) {
    if (data.error) {
      setError(data.error);
      setCompany(undefined);
      storeSetCompany(null);
    } else if (data.company) {
      const c = data.company as Company;
      setCompany(c);
      storeSetCompany(c);
      setError(undefined);
    }
  }

  return (
    <PageContainer className="max-w-2xl">
      <div className="mb-6">
        <Link href="/" className="text-sm text-blue-600 hover:underline flex items-center gap-1 mb-4">
          ← Back to search
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Check a Company</h1>
        <p className="text-slate-500 text-sm mt-1">Enter a company name or number to view compliance status.</p>
      </div>

      <CompanyLookupForm onResult={handleResult} loading={loading} setLoading={setLoading} />

      <div className="mt-6">
        {activated && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-7 h-7 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">Protection active</p>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">Your deadlines are now being monitored.</h2>
                <p className="text-sm text-green-700 mt-1">You'll receive alerts before any compliance deadlines are missed.</p>
                <Link href="/dashboard" className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-blue-600 hover:underline">
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        <CompanyLookupInlineResults loading={loading} error={error} company={company} />
      </div>

      <StickyMobileCTA />
    </PageContainer>
  );
}

export default function CheckPage() {
  return (
    <Suspense>
      <CheckPageInner />
    </Suspense>
  );
}
