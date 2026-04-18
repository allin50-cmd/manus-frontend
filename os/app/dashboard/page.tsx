'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApiKey } from '@/components/api-key-provider';

type Me = {
  user: { id: string; email: string; role: string };
  tenant: { id: string; name: string; plan: string };
};

type ApiKey = {
  id: string;
  vertical: string;
  active: boolean;
  createdAt: string;
};

type Lead = {
  id: string;
  vertical: string;
  name: string;
  email: string;
  stage: string;
  score: number | null;
  riskLevel: string | null;
  estimatedLeakLow: number | null;
  estimatedLeakHigh: number | null;
  complianceRiskScore: number | null;
  createdAt: string;
};

const VERTICALS = ['revenue', 'law', 'compliance'] as const;

export default function DashboardPage() {
  const router = useRouter();
  const { apiKey, setApiKey } = useApiKey();
  const [me, setMe] = useState<Me | null>(null);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [newKey, setNewKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const [meRes, keysRes, leadsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/keys'),
        fetch('/api/leads?limit=20'),
      ]);
      if (meRes.status === 401) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      const keysData = await keysRes.json();
      const leadsData = await leadsRes.json();
      setMe(meData);
      setKeys(keysData.keys ?? []);
      setLeads(leadsData.leads ?? []);
      setCounts(leadsData.counts ?? {});
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createKey(vertical: string) {
    setNewKey(null);
    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ vertical }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to create key');
      return;
    }
    setNewKey(data.rawKey);
    setApiKey(data.rawKey);
    load();
  }

  async function revokeKey(id: string) {
    await fetch(`/api/keys/${id}`, { method: 'DELETE' });
    load();
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setApiKey('');
    router.push('/login');
    router.refresh();
  }

  if (loading) return <p className="text-sm text-gray-600">Loading…</p>;
  if (!me) return <p className="text-sm text-red-600">{error ?? 'Not authenticated'}</p>;

  const isPro = me.tenant.plan === 'pro';

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{me.tenant.name}</h1>
          <p className="text-sm text-gray-600">{me.user.email} · Plan: <strong>{me.tenant.plan}</strong></p>
        </div>
        <div className="flex gap-2">
          {!isPro && (
            <Link href="/pricing" className="rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white">
              Upgrade to Pro
            </Link>
          )}
          <button onClick={logout} className="rounded border border-gray-300 px-3 py-1.5 text-sm">
            Sign out
          </button>
        </div>
      </header>

      {newKey && (
        <div className="rounded border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-medium">New API key (copy now — shown once):</p>
          <code className="mt-2 block overflow-x-auto rounded bg-white px-3 py-2 text-xs">{newKey}</code>
          <button onClick={() => setNewKey(null)} className="mt-2 text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">API keys</h2>
          <div className="flex gap-2">
            {VERTICALS.map((v) => (
              <button
                key={v}
                onClick={() => createKey(v)}
                disabled={!isPro && v !== 'revenue'}
                className="rounded border border-gray-300 px-3 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                + {v}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 overflow-x-auto rounded border border-gray-200 bg-white">
          {keys.length === 0 ? (
            <p className="p-4 text-sm text-gray-600">No keys yet. Create one above.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-3 py-2">Vertical</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Created</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id} className="border-t border-gray-100">
                    <td className="px-3 py-2">{k.vertical}</td>
                    <td className="px-3 py-2">{k.active ? 'active' : 'revoked'}</td>
                    <td className="px-3 py-2 text-gray-600">{new Date(k.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2 text-right">
                      {k.active && (
                        <button onClick={() => revokeKey(k.id)} className="text-xs text-red-600 underline">
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {apiKey && (
          <p className="mt-2 text-xs text-gray-600">
            Active key in browser: <code className="rounded bg-gray-100 px-1.5 py-0.5">{apiKey.slice(0, 12)}…</code>
          </p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Usage</h2>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {VERTICALS.map((v) => (
            <div key={v} className="rounded border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase text-gray-600">{v}</p>
              <p className="mt-1 text-2xl font-semibold">{counts[v] ?? 0}</p>
              <p className="text-xs text-gray-500">leads processed</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Recent leads</h2>
        <div className="mt-3 overflow-x-auto rounded border border-gray-200 bg-white">
          {leads.length === 0 ? (
            <p className="p-4 text-sm text-gray-600">
              No leads yet. Try <Link href="/audit" className="underline">running an audit</Link>.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Vertical</th>
                  <th className="px-3 py-2">Stage</th>
                  <th className="px-3 py-2">Score</th>
                  <th className="px-3 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} className="border-t border-gray-100">
                    <td className="px-3 py-2">{l.name}</td>
                    <td className="px-3 py-2">{l.vertical}</td>
                    <td className="px-3 py-2">{l.stage}</td>
                    <td className="px-3 py-2">{l.score ?? l.complianceRiskScore ?? '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{new Date(l.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
