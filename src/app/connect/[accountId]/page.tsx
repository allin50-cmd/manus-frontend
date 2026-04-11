'use client';

/**
 * /connect/[accountId] — Connected account management page
 *
 * NOTE: This page uses the Stripe account ID (acct_***) in the URL for
 * simplicity.  In production, use an opaque internal identifier (e.g. a
 * UUID from your database) and look up the Stripe account ID server-side.
 *
 * Features:
 *   - Onboarding status and "Onboard to collect payments" button
 *   - Create products on the connected account
 *   - Platform subscription management (subscribe / billing portal)
 */

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface AccountStatus {
  readyToProcessPayments: boolean;
  onboardingComplete: boolean;
  requirementsStatus: string;
  // Persisted by webhook handlers (null until first webhook fires)
  subscriptionStatus: string | null;
  subscriptionPriceId: string | null;
  lastPaymentAt: string | null;
  cardPaymentsStatus: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  default_price: { id: string; unit_amount: number | null; currency: string } | null;
}

export default function AccountPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const accountId = params.accountId as string;

  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Product creation form
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [productAmount, setProductAmount] = useState('');
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [productError, setProductError] = useState('');

  const [onboarding, setOnboarding] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const justOnboarded = searchParams?.get('onboarded') === '1';
  const justSubscribed = searchParams?.get('subscribed') === '1';

  useEffect(() => {
    fetchStatus();
    fetchProducts();
  }, [accountId]);

  // ── Fetch account onboarding status ──────────────────────────────────────
  async function fetchStatus() {
    setLoadingStatus(true);
    try {
      const res = await fetch(`/api/connect/accounts/${accountId}`);
      const data = await res.json();
      setStatus(data.status);
    } catch {
      // ignore
    } finally {
      setLoadingStatus(false);
    }
  }

  // ── Fetch products on this connected account ──────────────────────────────
  async function fetchProducts() {
    setLoadingProducts(true);
    try {
      const res = await fetch(`/api/connect/accounts/${accountId}/products`);
      const data = await res.json();
      setProducts(data.products ?? []);
    } catch {
      // ignore
    } finally {
      setLoadingProducts(false);
    }
  }

  // ── Start onboarding flow ─────────────────────────────────────────────────
  async function handleOnboard() {
    setOnboarding(true);
    try {
      const res = await fetch(`/api/connect/accounts/${accountId}/link`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setOnboarding(false);
    }
  }

  // ── Create a product ──────────────────────────────────────────────────────
  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    setCreatingProduct(true);
    setProductError('');

    // Convert pounds/dollars to pence/cents for the Stripe API
    const amount = Math.round(parseFloat(productAmount) * 100);
    if (isNaN(amount) || amount <= 0) {
      setProductError('Enter a valid price (e.g. 9.99)');
      setCreatingProduct(false);
      return;
    }

    try {
      const res = await fetch(`/api/connect/accounts/${accountId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: productName,
          description: productDesc,
          amount,
          currency: 'gbp',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProductError(data.error ?? 'Failed to create product');
        return;
      }
      setProductName('');
      setProductDesc('');
      setProductAmount('');
      await fetchProducts();
    } catch {
      setProductError('Network error');
    } finally {
      setCreatingProduct(false);
    }
  }

  // ── Subscribe to platform plan ────────────────────────────────────────────
  async function handleSubscribe() {
    setSubscribing(true);
    try {
      const res = await fetch(`/api/connect/accounts/${accountId}/subscription`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setSubscribing(false);
    } catch {
      setSubscribing(false);
    }
  }

  // ── Open billing portal ───────────────────────────────────────────────────
  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await fetch(`/api/connect/accounts/${accountId}/portal`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setPortalLoading(false);
    } catch {
      setPortalLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/connect" className="text-sm text-blue-600 hover:underline">
          ← All accounts
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Account Management</h1>
        <p className="text-xs text-slate-400 font-mono mt-1">{accountId}</p>
      </div>

      {/* ── Success banners ─────────────────────────────────────────── */}
      {justOnboarded && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          Onboarding complete. Refreshing status…
        </div>
      )}
      {justSubscribed && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          Subscription activated successfully.
        </div>
      )}

      {/* ── Onboarding status ────────────────────────────────────────── */}
      <section className="rounded-xl border bg-white shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-3">
          Payment Onboarding
        </h2>
        {loadingStatus ? (
          <p className="text-sm text-slate-500">Checking status…</p>
        ) : status ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full ${
                  status.onboardingComplete ? 'bg-green-500' : 'bg-amber-400'
                }`}
              />
              <span className="text-sm text-slate-700">
                {status.onboardingComplete
                  ? 'Onboarding complete'
                  : `Requirements: ${status.requirementsStatus}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full ${
                  status.readyToProcessPayments ? 'bg-green-500' : 'bg-slate-300'
                }`}
              />
              <span className="text-sm text-slate-700">
                {status.readyToProcessPayments
                  ? 'Card payments active'
                  : 'Card payments not yet active'}
              </span>
            </div>
            {!status.onboardingComplete && (
              <button
                onClick={handleOnboard}
                disabled={onboarding}
                className="mt-2 inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {onboarding ? 'Redirecting…' : 'Onboard to collect payments'}
              </button>
            )}
          </div>
        ) : (
          <p className="text-sm text-red-600">Failed to load account status.</p>
        )}
      </section>

      {/* ── Platform subscription ────────────────────────────────────── */}
      <section className="rounded-xl border bg-white shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-3">
          Platform Subscription
        </h2>

        {/* Live subscription status badge */}
        {status?.subscriptionStatus && (
          <div className="mb-4">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                status.subscriptionStatus === 'active'
                  ? 'bg-green-100 text-green-700'
                  : status.subscriptionStatus === 'past_due'
                  ? 'bg-red-100 text-red-700'
                  : status.subscriptionStatus === 'paused'
                  ? 'bg-amber-100 text-amber-700'
                  : status.subscriptionStatus === 'cancelled'
                  ? 'bg-slate-100 text-slate-600'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                status.subscriptionStatus === 'active'
                  ? 'bg-green-500'
                  : status.subscriptionStatus === 'past_due'
                  ? 'bg-red-500'
                  : status.subscriptionStatus === 'paused'
                  ? 'bg-amber-400'
                  : 'bg-slate-400'
              }`} />
              {status.subscriptionStatus.replace('_', ' ')}
            </span>
            {status.lastPaymentAt && (
              <span className="ml-3 text-xs text-slate-400">
                Last paid {new Date(status.lastPaymentAt).toLocaleDateString('en-GB')}
              </span>
            )}
          </div>
        )}

        {!status?.subscriptionStatus && (
          <p className="text-sm text-slate-500 mb-4">
            Subscribe to the platform plan to unlock advanced features.
          </p>
        )}

        <div className="flex gap-3">
          {status?.subscriptionStatus !== 'active' &&
           status?.subscriptionStatus !== 'paused' && (
            <button
              onClick={handleSubscribe}
              disabled={subscribing}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {subscribing ? 'Redirecting…' : 'Subscribe'}
            </button>
          )}
          <button
            onClick={handlePortal}
            disabled={portalLoading}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-colors"
          >
            {portalLoading ? 'Opening…' : 'Manage subscription'}
          </button>
        </div>
      </section>

      {/* ── Create product ───────────────────────────────────────────── */}
      <section className="rounded-xl border bg-white shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">
          Add a Product
        </h2>
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Product name
            </label>
            <input
              type="text"
              required
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Compliance Report"
              className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={productDesc}
              onChange={(e) => setProductDesc(e.target.value)}
              placeholder="e.g. Annual compliance audit report"
              className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Price (£)
            </label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={productAmount}
              onChange={(e) => setProductAmount(e.target.value)}
              placeholder="9.99"
              className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {productError && (
            <p className="text-sm text-red-600">{productError}</p>
          )}
          <button
            type="submit"
            disabled={creatingProduct}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {creatingProduct ? 'Creating…' : 'Create product'}
          </button>
        </form>
      </section>

      {/* ── Products list ────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-900">Products</h2>
          <Link
            href={`/store/${accountId}`}
            target="_blank"
            className="text-sm text-blue-600 hover:underline"
          >
            View storefront →
          </Link>
        </div>
        {loadingProducts ? (
          <p className="text-sm text-slate-500">Loading products…</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-slate-500">No products yet. Create one above.</p>
        ) : (
          <div className="space-y-2">
            {products.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border bg-white p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                  {p.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{p.description}</p>
                  )}
                </div>
                {p.default_price?.unit_amount && (
                  <span className="text-sm font-semibold text-slate-700">
                    £{(p.default_price.unit_amount / 100).toFixed(2)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
