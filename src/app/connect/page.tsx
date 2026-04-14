'use client';

/**
 * /connect — Stripe Connect dashboard
 *
 * Allows platform users to:
 *   1. Create a new connected account
 *   2. See all connected accounts and their onboarding status
 *   3. Navigate to each account's management page
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ConnectedAccount {
  id: string;
  stripe_account_id: string;
  display_name: string;
  email: string;
  created_at: string;
}

export default function ConnectDashboard() {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  // Form state for creating a new account
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Load existing connected accounts on mount
  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    setLoadingAccounts(true);
    try {
      const res = await fetch('/api/connect/accounts');
      const data = await res.json();
      setAccounts(data.accounts ?? []);
    } catch {
      // silently fail — accounts list will be empty
    } finally {
      setLoadingAccounts(false);
    }
  }

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError('');

    try {
      const res = await fetch('/api/connect/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error ?? 'Failed to create account');
        return;
      }
      // Refresh the list and reset form
      setDisplayName('');
      setEmail('');
      await fetchAccounts();
    } catch {
      setCreateError('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Stripe Connect</h1>
      <p className="text-sm text-slate-500 mb-8">
        Create and manage connected accounts that can accept payments.
      </p>

      {/* ── Create new account form ───────────────────────────────────── */}
      <section className="rounded-xl border bg-white shadow-sm p-6 mb-8">
        <h2 className="text-base font-semibold text-slate-900 mb-4">
          Create a Connected Account
        </h2>
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Business name
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Acme Ltd"
              className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Contact email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@acme.com"
              className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {createError && (
            <p className="text-sm text-red-600">{createError}</p>
          )}
          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {creating ? 'Creating…' : 'Create account'}
          </button>
        </form>
      </section>

      {/* ── Connected accounts list ───────────────────────────────────── */}
      <section>
        <h2 className="text-base font-semibold text-slate-900 mb-3">
          Connected Accounts
        </h2>
        {loadingAccounts ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : accounts.length === 0 ? (
          <p className="text-sm text-slate-500">No connected accounts yet.</p>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <Link
                key={account.stripe_account_id}
                href={`/connect/${account.stripe_account_id}`}
                className="block rounded-xl border bg-white shadow-sm p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {account.display_name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{account.email}</p>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      {account.stripe_account_id}
                    </p>
                  </div>
                  <span className="text-sm text-blue-600 font-medium">Manage →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
