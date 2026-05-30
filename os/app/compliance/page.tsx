'use client';

import { useState } from 'react';
import { callApi, useApiKey } from '@/components/api-key-provider';

type CheckResult = {
  success: boolean;
  companyNumber?: string;
  companyName?: string;
  riskScore?: number;
  riskLevel?: 'Low' | 'Medium' | 'High';
  predictedPenalty?: number;
  upcomingDeadlines?: { type: string; dueDate: string; daysLeft: number; overdue: boolean }[];
  drivers?: string[];
  error?: string;
};

type WebhookResult = { success: boolean; subscriptionId?: string; companyNumber?: string; webhookUrl?: string; error?: string };

export default function CompliancePage() {
  const { apiKey } = useApiKey();
  const [companyNumber, setCompanyNumber] = useState('');
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);

  const [webhookCompany, setWebhookCompany] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [registering, setRegistering] = useState(false);
  const [webhookResult, setWebhookResult] = useState<WebhookResult | null>(null);

  const check = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) return setCheckResult({ success: false, error: 'Set an API key in the top bar first.' });
    setChecking(true);
    const res = await callApi<CheckResult>('/api/compliance/check-company', { companyNumber }, apiKey);
    setCheckResult(res.data as CheckResult);
    setChecking(false);
  };

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) return setWebhookResult({ success: false, error: 'Set an API key in the top bar first.' });
    setRegistering(true);
    const res = await callApi<WebhookResult>(
      '/api/compliance/register-webhook',
      { companyNumber: webhookCompany, webhookUrl },
      apiKey,
    );
    setWebhookResult(res.data as WebhookResult);
    setRegistering(false);
  };

  return (
    <div className="space-y-8 md:space-y-10">
      <section className="grid gap-6 md:gap-8 lg:grid-cols-2">
        <form onSubmit={check} className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
          <h1 className="text-xl font-semibold">Check company</h1>
          <Field label="UK company number">
            <input
              required
              autoCapitalize="characters"
              autoComplete="off"
              value={companyNumber}
              onChange={(e) => setCompanyNumber(e.target.value)}
              placeholder="12345678 or SC123456"
              className={inputCls}
            />
          </Field>
          <button
            disabled={checking}
            className="inline-flex h-11 w-full items-center justify-center rounded bg-gray-900 px-4 text-sm font-medium text-white hover:bg-black disabled:opacity-50 sm:w-auto"
          >
            {checking ? 'Checking…' : 'Check'}
          </button>
          <p className="text-xs text-gray-500">
            Requires a server-side <code>COMPANIES_HOUSE_API_KEY</code>.
          </p>
        </form>

        <div>
          {checkResult?.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{checkResult.error}</div>
          )}
          {checkResult?.companyNumber && (
            <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
              <div>
                <h2 className="break-words text-lg font-semibold">{checkResult.companyName}</h2>
                <p className="text-xs text-gray-500">Company {checkResult.companyNumber}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm sm:gap-3">
                <Stat label="Risk" value={checkResult.riskLevel ?? '–'} />
                <Stat label="Score / 100" value={String(checkResult.riskScore ?? 0)} />
                <Stat label="Penalty" value={`£${(checkResult.predictedPenalty ?? 0).toLocaleString()}`} />
              </div>
              {checkResult.upcomingDeadlines && checkResult.upcomingDeadlines.length > 0 && (
                <div>
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Upcoming deadlines</h3>
                  <ul className="space-y-1 text-sm">
                    {checkResult.upcomingDeadlines.map((d, i) => (
                      <li key={i} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className={'font-medium ' + (d.overdue ? 'text-red-700' : d.daysLeft < 7 ? 'text-amber-700' : 'text-gray-700')}>
                          {d.overdue ? 'OVERDUE' : `${d.daysLeft}d`}
                        </span>
                        <span className="text-gray-600">{d.type.replace(/_/g, ' ')} — due {d.dueDate}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {checkResult.drivers && (
                <div>
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Drivers</h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
                    {checkResult.drivers.map((d) => (<li key={d} className="break-words">{d}</li>))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 md:gap-8 lg:grid-cols-2">
        <form onSubmit={register} className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
          <h1 className="text-xl font-semibold">Register alert webhook</h1>
          <Field label="Company number">
            <input
              required
              autoCapitalize="characters"
              autoComplete="off"
              value={webhookCompany}
              onChange={(e) => setWebhookCompany(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Webhook URL">
            <input
              required
              type="url"
              inputMode="url"
              autoComplete="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://tenant.example.com/hooks/ch"
              className={inputCls}
            />
          </Field>
          <button
            disabled={registering}
            className="inline-flex h-11 w-full items-center justify-center rounded bg-gray-900 px-4 text-sm font-medium text-white hover:bg-black disabled:opacity-50 sm:w-auto"
          >
            {registering ? 'Registering…' : 'Register'}
          </button>
          <p className="text-xs text-gray-500">
            Payloads are HMAC-signed via <code>x-uios-signature</code> when <code>WEBHOOK_SIGNING_SECRET</code> is set.
          </p>
        </form>

        <div>
          {webhookResult?.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{webhookResult.error}</div>
          )}
          {webhookResult?.subscriptionId && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-sm text-green-900 sm:p-6">
              <p className="font-medium">Registered.</p>
              <p className="mt-1 break-words">
                Subscription <code className="break-all">{webhookResult.subscriptionId}</code> will deliver alerts for company{' '}
                <strong>{webhookResult.companyNumber}</strong> to <code className="break-all">{webhookResult.webhookUrl}</code>.
              </p>
            </div>
          )}
        </div>
      </section>
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
