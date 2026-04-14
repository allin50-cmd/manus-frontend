'use client';

/**
 * /store/[accountId] — Customer-facing storefront for a connected account
 *
 * NOTE: This page uses the Stripe account ID (acct_***) in the URL for
 * simplicity.  In production, use an opaque internal identifier (e.g. a
 * UUID or slug from your database) and look up the Stripe account ID
 * server-side to avoid exposing internal Stripe identifiers.
 *
 * Displays products created by the connected account and allows customers
 * to purchase them via Stripe Checkout (direct charge model).
 */

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  description: string | null;
  default_price: { id: string; unit_amount: number | null; currency: string } | null;
}

export default function StorefrontPage() {
  const params = useParams();
  const accountId = params.accountId as string;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Per-product checkout loading state
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [accountId]);

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await fetch(`/api/connect/accounts/${accountId}/products`);
      if (!res.ok) {
        setError('Unable to load products.');
        return;
      }
      const data = await res.json();
      setProducts(data.products ?? []);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleBuy(priceId: string) {
    setCheckingOut(priceId);
    try {
      const res = await fetch(`/api/connect/accounts/${accountId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, quantity: 1 }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckingOut(null);
      }
    } catch {
      setCheckingOut(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        {/* ── Store header ─────────────────────────────────────────── */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Store</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse and purchase available products below.
          </p>
        </div>

        {/* ── Loading / error / empty states ───────────────────────── */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border bg-white p-6 animate-pulse"
              >
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {error}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border bg-white p-10 text-center">
            <p className="text-slate-500 text-sm">No products available yet.</p>
          </div>
        ) : (
          /* ── Product grid ──────────────────────────────────────────── */
          <div className="space-y-4">
            {products.map((product) => {
              const price = product.default_price;
              const priceId = price?.id;
              const amount = price?.unit_amount;
              const currency = price?.currency ?? 'gbp';
              const isLoading = checkingOut === priceId;

              const formattedPrice =
                amount != null
                  ? new Intl.NumberFormat('en-GB', {
                      style: 'currency',
                      currency: currency.toUpperCase(),
                    }).format(amount / 100)
                  : null;

              return (
                <div
                  key={product.id}
                  className="rounded-xl border bg-white shadow-sm p-6 flex items-start justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-semibold text-slate-900">
                      {product.name}
                    </h2>
                    {product.description && (
                      <p className="text-sm text-slate-500 mt-1">
                        {product.description}
                      </p>
                    )}
                    {formattedPrice && (
                      <p className="text-lg font-bold text-slate-900 mt-3">
                        {formattedPrice}
                      </p>
                    )}
                  </div>

                  {priceId ? (
                    <button
                      onClick={() => handleBuy(priceId)}
                      disabled={checkingOut !== null}
                      className="shrink-0 inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
                    >
                      {isLoading ? 'Redirecting…' : 'Buy now'}
                    </button>
                  ) : (
                    <span className="shrink-0 text-sm text-slate-400">
                      Not available
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
