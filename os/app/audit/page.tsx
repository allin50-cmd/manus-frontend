'use client';

import { useState } from 'react';
import { callApi } from '@/components/api-key-provider';

type SubmitResponse = {
  success: boolean;
  leadId?: string;
  deduplicated?: boolean;
  result?: {
    estimatedLeak: { low: number; high: number };
    riskLevel: 'Low' | 'Moderate' | 'High';
    confidence: number;
    drivers: string[];
    score: number;
  };
  error?: string;
};

const PAIN_OPTIONS = [
  { id: 'unbilled_work', label: 'Unbilled work' },
  { id: 'manual_admin', label: 'Manual admin' },
  { id: 'slow_billing', label: 'Slow billing' },
];

export default function AuditPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    system: 'MLC',
    sizeTier: '10-30',
    painPoints: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [narrative, setNarrative] = useState<string>('');

  const togglePain = (id: string) => {
    setForm((f) => ({
      ...f,
      painPoints: f.painPoints.includes(id)
        ? f.painPoints.filter((p) => p !== id)
        : [...f.painPoints, id],
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNarrative('');
    const res = await callApi<SubmitResponse>('/api/revenue/submit', form);
    setResult(res.data as SubmitResponse);
    setLoading(false);
  };

  const runNarrative = async () => {
    if (!result?.result) return;
    setLoading(true);
    const res = await callApi<{ narrative: string; error?: string }>(
      '/api/revenue/narrative',
      { lead: { name: form.name, system: form.system, sizeTier: form.sizeTier, painPoints: form.painPoints }, result: result.result },
    );
    const data = res.data as { narrative?: string; error?: string };
    setNarrative(data.narrative ?? data.error ?? '');
    setLoading(false);
  };

  return (
    <div className="grid gap-6 md:gap-8 lg:grid-cols-2">
      <form onSubmit={submit} className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
        <h1 className="text-xl font-semibold">Revenue audit</h1>
        <Field label="Name">
          <input required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Email">
          <input required type="email" inputMode="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Phone (optional)">
          <input type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Billing system">
          <select value={form.system} onChange={(e) => setForm({ ...form, system: e.target.value })} className={inputCls}>
            {['MLC', 'Opus2', 'BarBooks', 'Other'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Size tier">
          <select value={form.sizeTier} onChange={(e) => setForm({ ...form, sizeTier: e.target.value })} className={inputCls}>
            {['1-10', '10-30', '30-70', '70+'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Pain points">
          <div className="flex flex-wrap gap-2">
            {PAIN_OPTIONS.map((p) => {
              const active = form.painPoints.includes(p.id);
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => togglePain(p.id)}
                  className={
                    'min-h-10 rounded-full border px-4 py-2 text-sm ' +
                    (active
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-500')
                  }
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </Field>
        <button
          disabled={loading}
          className="inline-flex h-11 w-full items-center justify-center rounded bg-gray-900 px-4 text-sm font-medium text-white hover:bg-black disabled:opacity-50 sm:w-auto"
        >
          {loading ? 'Running…' : 'Run audit'}
        </button>
      </form>

      <div className="space-y-4">
        {result?.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {result.error}
          </div>
        )}
        {result?.result && (
          <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Audit result</h2>
            <p className="break-all text-sm text-gray-500">
              Lead ID: <code>{result.leadId}</code>
              {result.deduplicated ? ' (deduplicated — matched an existing lead)' : ''}
            </p>
            <div className="grid grid-cols-3 gap-2 text-sm sm:gap-3">
              <Stat label="Risk" value={result.result.riskLevel} />
              <Stat label="Score" value={String(result.result.score)} />
              <Stat label="Confidence" value={`${(result.result.confidence * 100).toFixed(0)}%`} />
            </div>
            <p className="text-sm">
              Estimated annual leakage:{' '}
              <strong>
                £{result.result.estimatedLeak.low.toLocaleString()}–£
                {result.result.estimatedLeak.high.toLocaleString()}
              </strong>
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
              {result.result.drivers.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={runNarrative}
              className="inline-flex h-10 w-full items-center justify-center rounded border border-gray-300 px-3 text-sm hover:border-gray-500 sm:w-auto"
            >
              Generate narrative
            </button>
            {narrative && (
              <pre className="whitespace-pre-wrap break-words rounded-md bg-gray-50 p-3 text-sm text-gray-800">
                {narrative}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const inputCls = 'block h-11 w-full rounded border border-gray-300 bg-white px-3 text-base focus:border-gray-500 focus:outline-none sm:h-10 sm:text-sm';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">{label}</span>
      {children}
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-gray-50 p-3">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
