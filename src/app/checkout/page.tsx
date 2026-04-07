'use client';

import { useState } from 'react';
import { useCompanyStore } from '@/lib/stores/company-store';
import { CheckoutSummary } from '@/components/checkout/CheckoutSummary';
import { ProofPanel } from '@/components/checkout/ProofPanel';
import { PageContainer } from '@/components/shared/PageContainer';
import { Loader2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const { company, selectedServices } = useCompanyStore();
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    if (!company || !selectedServices.length) return;
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyNumber: company.number,
          companyName: company.name,
          selectedServices,
        }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error ?? 'Could not start checkout. Please try again.');
      }
    } catch {
      toast.error('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  if (!selectedServices.length) {
    return (
      <PageContainer className="max-w-xl text-center py-24">
        <p className="text-slate-600 mb-4">No services selected. Please go back and choose what to monitor.</p>
        <Link href="/check" className="text-blue-600 hover:underline text-sm">← Back to check</Link>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="max-w-4xl">
      <div className="mb-6">
        <Link href="/check" className="text-sm text-blue-600 hover:underline flex items-center gap-1 mb-4">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Secure Checkout</h1>
        <p className="text-slate-500 text-sm mt-1">Your subscription activates immediately after payment.</p>
      </div>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="space-y-4">
          <CheckoutSummary />
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting to payment…</>
            ) : (
              <><ShieldCheck className="w-4 h-4" /> Pay {(selectedServices.length).toFixed(0)} × £1.00/mo</>
            )}
          </button>
          <p className="text-xs text-center text-slate-400">Secure payment powered by Stripe. Cancel anytime.</p>
        </div>
        <ProofPanel />
      </div>
    </PageContainer>
  );
}
