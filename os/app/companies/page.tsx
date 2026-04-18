'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FineStatusBadge } from '@/components/FineStatusBadge';
import { useSubscription } from '@/hooks/useSubscription';
import { useCompanyCount } from '@/hooks/useCompanyCount';
import { canAddCompany } from '@/lib/plans';

interface Company {
  id: string;
  name: string;
  companyNumber: string | null;
  fineStatus: string;
  nextDeadlineAt: string | null;
  createdAt: string;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Europe/London',
  });
}

export default function CompaniesPage() {
  const router = useRouter();
  const { plan } = useSubscription();
  const { count, refresh } = useCompanyCount();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [companyNumber, setCompanyNumber] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  async function loadCompanies() {
    setLoading(true);
    try {
      const res = await fetch('/api/companies');
      if (res.status === 401) { router.push('/login'); return; }
      const data = await res.json();
      setCompanies(data.companies ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCompanies(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    setAdding(true);
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, companyNumber: companyNumber || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error ?? 'Failed'); return; }
      setName('');
      setCompanyNumber('');
      loadCompanies();
      refresh();
    } finally {
      setAdding(false);
    }
  }

  const atLimit = plan !== null && count !== null && !canAddCompany(plan.id, count);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Companies</h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitor UK Companies House filing deadlines and fine risk.
        </p>
      </header>

      <section className="rounded-md border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-600">
          Add company
        </h2>
        {atLimit ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-800">
              You've reached the {plan?.companies}-company limit on your{' '}
              <strong>{plan?.label}</strong> plan.{' '}
              <a href="/pricing" className="underline">Upgrade</a> to monitor more.
            </p>
          </div>
        ) : (
          <form onSubmit={handleAdd} className="flex flex-wrap gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Company name"
              required
              className="flex-1 min-w-[180px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <input
              value={companyNumber}
              onChange={(e) => setCompanyNumber(e.target.value)}
              placeholder="Co. number (optional)"
              className="w-44 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <button
              type="submit"
              disabled={adding}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {adding ? 'Adding…' : 'Add'}
            </button>
          </form>
        )}
        {addError && <p className="mt-2 text-sm text-red-600">{addError}</p>}
      </section>

      <section>
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : companies.length === 0 ? (
          <p className="text-sm text-gray-500">No companies yet. Add one above.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Co. No.</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Next Deadline</th>
                  <th className="px-4 py-3">Added</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr key={c.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-gray-500">{c.companyNumber ?? '—'}</td>
                    <td className="px-4 py-3">
                      <FineStatusBadge status={c.fineStatus} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(c.nextDeadlineAt)}</td>
                    <td className="px-4 py-3 text-gray-400">{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
