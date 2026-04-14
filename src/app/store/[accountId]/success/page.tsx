'use client';

/**
 * /store/[accountId]/success — Post-purchase confirmation page
 *
 * Customers land here after a successful Stripe Checkout session.
 * The `session_id` query parameter is set by Stripe automatically.
 *
 * NOTE: As with the storefront, this uses acct_*** in the URL for
 * simplicity.  Use an opaque identifier in production.
 */

import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PurchaseSuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const accountId = params.accountId as string;

  // session_id is appended by Stripe — can be used server-side to verify
  // and fulfil the order if needed.
  const sessionId = searchParams?.get('session_id');

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* ── Success icon ─────────────────────────────────────────── */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* ── Message ───────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payment successful</h1>
          <p className="text-sm text-slate-500 mt-2">
            Thank you for your purchase. A confirmation will be sent to your email.
          </p>
          {sessionId && (
            <p className="text-xs text-slate-400 font-mono mt-3">
              Order ref: {sessionId}
            </p>
          )}
        </div>

        {/* ── Back to store ─────────────────────────────────────────── */}
        <Link
          href={`/store/${accountId}`}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          ← Back to store
        </Link>
      </div>
    </div>
  );
}
