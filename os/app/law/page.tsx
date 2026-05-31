'use client';

import { useState } from 'react';
import { callApi, useApiKey } from '@/components/api-key-provider';

type ProcessResult = {
  success: boolean;
  document?: { source: string; mime: string; bytes: number };
  tasks?: { description: string; deadline?: string; owner?: string; priority?: string }[];
  parties?: string[];
  deadlines?: { description: string; date?: string }[];
  billingEntries?: { description: string; hours: number; value: number }[];
  complianceFlags?: { type: string; severity: 'Low' | 'Medium' | 'High'; detail?: string }[];
  summary?: string;
  error?: string;
};

type BillingResult = {
  success: boolean;
  entries?: { description: string; hours: number; value: number }[];
  totalValue?: number;
  totalHours?: number;
  source?: 'ai' | 'deterministic';
  error?: string;
};

export default function LawPage() {
  const { apiKey } = useApiKey();
  const [docUrl, setDocUrl] = useState('');
  const [docType, setDocType] = useState<'brief' | 'email' | 'transcript' | 'pleading'>('brief');
  const [rate, setRate] = useState(300);
  const [processing, setProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null);

  const [notes, setNotes] = useState('');
  const [billRate, setBillRate] = useState(300);
  const [billing, setBilling] = useState(false);
  const [billingResult, setBillingResult] = useState<BillingResult | null>(null);

  const process = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) return setProcessResult({ success: false, error: 'Set an API key in the top bar first.' });
    setProcessing(true);
    const res = await callApi<ProcessResult>(
      '/api/law/process-document',
      { documentUrl: docUrl, documentType: docType, ratePerHour: rate },
      apiKey,
    );
    setProcessResult(res.data as ProcessResult);
    setProcessing(false);
  };

  const genBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) return setBillingResult({ success: false, error: 'Set an API key in the top bar first.' });
    setBilling(true);
    const res = await callApi<BillingResult>(
      '/api/law/generate-billing',
      { text: notes, ratePerHour: billRate },
      apiKey,
    );
    setBillingResult(res.data as BillingResult);
    setBilling(false);
  };

  return (
    <div className="space-y-8 md:space-y-10">
      <section className="grid gap-6 md:gap-8 lg:grid-cols-2">
        <form onSubmit={process} className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
          <h1 className="text-xl font-semibold">Process document</h1>
          <Field label="Document URL (PDF, DOCX, text or HTML)">
            <input
              required
              type="url"
              inputMode="url"
              autoComplete="url"
              value={docUrl}
              onChange={(e) => setDocUrl(e.target.value)}
              placeholder="https://storage.example.com/brief.pdf"
              className={inputCls}
            />
          </Field>
          <Field label="Document type">
            <select value={docType} onChange={(e) => setDocType(e.target.value as typeof docType)} className={inputCls}>
              {(['brief', 'email', 'transcript', 'pleading'] as const).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Rate per hour (£)">
            <input type="number" inputMode="numeric" min={0} value={rate} onChange={(e) => setRate(Number(e.target.value))} className={inputCls} />
          </Field>
          <button
            disabled={processing}
            className="inline-flex h-11 w-full items-center justify-center rounded bg-gray-900 px-4 text-sm font-medium text-white hover:bg-black disabled:opacity-50 sm:w-auto"
          >
            {processing ? 'Processing…' : 'Process'}
          </button>
        </form>

        <div className="space-y-4">
          {processResult?.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{processResult.error}</div>
          )}
          {processResult?.tasks && (
            <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
              <h2 className="text-lg font-semibold">Extraction</h2>
              {processResult.summary && (
                <p className="text-sm text-gray-700">{processResult.summary}</p>
              )}
              <Section title={`Tasks (${processResult.tasks.length})`}>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {processResult.tasks.map((t, i) => (
                    <li key={i} className="break-words">
                      {t.description}
                      {t.deadline && <span className="ml-2 text-xs text-gray-500">due {t.deadline}</span>}
                    </li>
                  ))}
                </ul>
              </Section>
              {processResult.parties && processResult.parties.length > 0 && (
                <Section title="Parties">
                  <p className="break-words text-sm">{processResult.parties.join(', ')}</p>
                </Section>
              )}
              {processResult.deadlines && processResult.deadlines.length > 0 && (
                <Section title="Deadlines">
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    {processResult.deadlines.map((d, i) => (
                      <li key={i} className="break-words">{d.description}</li>
                    ))}
                  </ul>
                </Section>
              )}
              {processResult.billingEntries && processResult.billingEntries.length > 0 && (
                <Section title={`Billing entries (${processResult.billingEntries.length})`}>
                  <div className="-mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
                    <table className="w-full min-w-[420px] text-sm">
                      <thead className="text-left text-xs uppercase text-gray-500">
                        <tr><th className="py-1">Description</th><th className="py-1">Hours</th><th className="py-1">Value</th></tr>
                      </thead>
                      <tbody>
                        {processResult.billingEntries.map((e, i) => (
                          <tr key={i} className="border-t border-gray-100 align-top">
                            <td className="py-1 pr-4">{e.description}</td>
                            <td className="py-1 pr-4 whitespace-nowrap">{e.hours}</td>
                            <td className="py-1 whitespace-nowrap">£{e.value.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Section>
              )}
              {processResult.complianceFlags && processResult.complianceFlags.length > 0 && (
                <Section title="Compliance flags">
                  <ul className="space-y-1 text-sm">
                    {processResult.complianceFlags.map((f, i) => (
                      <li key={i} className="break-words">
                        <SeverityTag severity={f.severity} /> <strong>{f.type}</strong>
                        {f.detail && <span className="ml-1 text-gray-600">— {f.detail}</span>}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 md:gap-8 lg:grid-cols-2">
        <form onSubmit={genBilling} className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
          <h1 className="text-xl font-semibold">Generate billing from notes</h1>
          <Field label="Notes">
            <textarea
              required
              rows={8}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={'Reviewed disclosure bundle 2h\nDrafted witness statement 1.5h\nConference with client'}
              className={textareaCls + ' font-mono'}
            />
          </Field>
          <Field label="Rate per hour (£)">
            <input type="number" inputMode="numeric" min={0} value={billRate} onChange={(e) => setBillRate(Number(e.target.value))} className={inputCls} />
          </Field>
          <button
            disabled={billing}
            className="inline-flex h-11 w-full items-center justify-center rounded bg-gray-900 px-4 text-sm font-medium text-white hover:bg-black disabled:opacity-50 sm:w-auto"
          >
            {billing ? 'Generating…' : 'Generate'}
          </button>
        </form>

        <div>
          {billingResult?.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{billingResult.error}</div>
          )}
          {billingResult?.entries && (
            <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold">Billing ({billingResult.source})</h2>
                <span className="text-sm text-gray-500">
                  {billingResult.totalHours}h · £{billingResult.totalValue?.toLocaleString()}
                </span>
              </div>
              <div className="-mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
                <table className="w-full min-w-[420px] text-sm">
                  <thead className="text-left text-xs uppercase text-gray-500">
                    <tr><th className="py-1">Description</th><th className="py-1">Hours</th><th className="py-1">Value</th></tr>
                  </thead>
                  <tbody>
                    {billingResult.entries.map((e, i) => (
                      <tr key={i} className="border-t border-gray-100 align-top">
                        <td className="py-1 pr-4">{e.description}</td>
                        <td className="py-1 pr-4 whitespace-nowrap">{e.hours}</td>
                        <td className="py-1 whitespace-nowrap">£{e.value.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

const inputCls = 'block h-11 w-full rounded border border-gray-300 bg-white px-3 text-base focus:border-gray-500 focus:outline-none sm:h-10 sm:text-sm';
const textareaCls = 'block w-full rounded border border-gray-300 bg-white px-3 py-2 text-base focus:border-gray-500 focus:outline-none sm:text-sm';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">{label}</span>
      {children}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
      {children}
    </div>
  );
}

function SeverityTag({ severity }: { severity: 'Low' | 'Medium' | 'High' }) {
  const cls = severity === 'High' ? 'bg-red-100 text-red-800' : severity === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700';
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${cls}`}>{severity}</span>
  );
}
