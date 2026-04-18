'use client';

import { useState } from 'react';

interface PricingTier {
  name: string;
  price: string;
  per: string;
  features: string[];
  cta: string | null;
  highlight: boolean;
}

const TIERS: PricingTier[] = [
  {
    name: 'Free',
    price: '£0',
    per: '/mo',
    features: [
      '1 company monitored',
      'Companies House deadline tracking',
      'Email alerts',
      'Revenue vertical',
    ],
    cta: null,
    highlight: false,
  },
  {
    name: 'Pro',
    price: '£10',
    per: '/mo',
    features: [
      'Up to 10 companies',
      'SMS alerts',
      'Fine Estimator',
      'All verticals (Revenue, Law, Compliance)',
      'Priority support',
    ],
    cta: 'Upgrade to Pro',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    per: '',
    features: [
      'Unlimited companies',
      'Fine reimbursement guarantee',
      'Dedicated account manager',
      'SLA + audit trail',
      'SSO / custom domain',
    ],
    cta: 'Contact us',
    highlight: false,
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout', { method: 'POST' });
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Checkout failed (${res.status})`);
      }
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl py-12 px-4">
      <h1 className="text-3xl font-semibold text-slate-900">Pricing</h1>
      <p className="mt-2 text-gray-600">
        Prevent UK Companies House fines before they happen.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            className={`rounded-md border bg-white p-6 flex flex-col ${
              tier.highlight ? 'border-slate-900 border-2' : 'border-gray-200'
            }`}
          >
            {tier.highlight && (
              <span className="mb-3 inline-block self-start rounded-md bg-slate-900 px-2 py-0.5 text-xs font-medium text-white">
                Most popular
              </span>
            )}
            <h2 className="text-lg font-semibold text-slate-900">{tier.name}</h2>
            <p className="mt-1">
              <span className="text-2xl font-bold text-slate-900">{tier.price}</span>
              {tier.per && (
                <span className="text-sm font-normal text-gray-500">{tier.per}</span>
              )}
            </p>
            <ul className="mt-5 flex-1 space-y-2">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-0.5 text-emerald-600">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            {tier.cta && (
              <div className="mt-6">
                {tier.name === 'Pro' ? (
                  <>
                    <button
                      type="button"
                      onClick={startCheckout}
                      disabled={loading}
                      className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                    >
                      {loading ? 'Redirecting…' : tier.cta}
                    </button>
                    {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
                  </>
                ) : (
                  <a
                    href="mailto:hello@fineguardpro.co.uk"
                    className="block w-full rounded-md border border-slate-900 px-4 py-2.5 text-center text-sm font-medium text-slate-900"
                  >
                    {tier.cta}
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
