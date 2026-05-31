'use client';

import { useState } from 'react';

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
    <div className="mx-auto max-w-3xl py-12">
      <h1 className="text-3xl font-semibold">Pricing</h1>
      <p className="mt-2 text-gray-600">One plan. All verticals.</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Free</h2>
          <p className="mt-1 text-2xl font-bold">£0<span className="text-sm font-normal text-gray-600">/mo</span></p>
          <ul className="mt-4 space-y-1.5 text-sm text-gray-700">
            <li>Revenue vertical only</li>
            <li>50 leads / month</li>
            <li>Community support</li>
          </ul>
        </div>

        <div className="rounded-lg border-2 border-gray-900 bg-white p-6">
          <h2 className="text-lg font-semibold">Pro</h2>
          <p className="mt-1 text-2xl font-bold">£49<span className="text-sm font-normal text-gray-600">/mo</span></p>
          <ul className="mt-4 space-y-1.5 text-sm text-gray-700">
            <li>All verticals (Revenue, Law, Compliance)</li>
            <li>Unlimited leads & drafts</li>
            <li>Priority support</li>
          </ul>
          <button
            type="button"
            onClick={startCheckout}
            disabled={loading}
            className="mt-6 w-full rounded bg-gray-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? 'Redirecting…' : 'Upgrade to Pro'}
          </button>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
