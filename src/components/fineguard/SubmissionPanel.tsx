/**
 * MTD Submission Panel
 * UI for configuring and submitting a VAT return to HMRC.
 */
import React, { useState } from 'react';
import { Send, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { submitMtd } from '@/services/mtdApi';
import type { ValidationError } from '@/services/mtdApi';

interface SubmissionPanelProps {
  tenantId: string;
  importId?: string;
  onSuccess?: (receipt: { formBundleNumber: string; processingDate: string }) => void;
}

export default function SubmissionPanel({ tenantId, importId, onSuccess }: SubmissionPanelProps) {
  const [form, setForm] = useState({
    vatNumber: '',
    periodKey: '',
    periodStart: '',
    periodEnd: '',
    idempotencyKey: crypto.randomUUID(),
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    status: string;
    receipt?: { formBundleNumber: string; processingDate: string; correlationId: string };
    validationErrors?: ValidationError[];
    error?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await submitMtd(
        {
          idempotencyKey: form.idempotencyKey,
          vatNumber: form.vatNumber,
          periodKey: form.periodKey,
          periodStart: form.periodStart,
          periodEnd: form.periodEnd,
          importId,
        },
        tenantId
      );

      setResult({
        status: res.status,
        receipt: res.receipt,
        validationErrors: res.validationErrors,
      });

      if (res.status === 'accepted' && res.receipt && onSuccess) {
        onSuccess(res.receipt);
      }
    } catch (err) {
      setResult({ status: 'error', error: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Send className="w-4 h-4 text-[#C9A64A]" />
        Submit VAT Return to HMRC
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">VAT Number</label>
            <input
              type="text"
              value={form.vatNumber}
              onChange={(e) => setForm((f) => ({ ...f, vatNumber: e.target.value }))}
              placeholder="123456789"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A64A]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Period Key</label>
            <input
              type="text"
              value={form.periodKey}
              onChange={(e) => setForm((f) => ({ ...f, periodKey: e.target.value }))}
              placeholder="24A1"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A64A]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Period Start</label>
            <input
              type="date"
              value={form.periodStart}
              onChange={(e) => setForm((f) => ({ ...f, periodStart: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A64A]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Period End</label>
            <input
              type="date"
              value={form.periodEnd}
              onChange={(e) => setForm((f) => ({ ...f, periodEnd: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A64A]"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Idempotency Key</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={form.idempotencyKey}
              readOnly
              className="flex-1 border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600 font-mono"
            />
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, idempotencyKey: crypto.randomUUID() }))}
              className="text-xs text-gray-500 hover:text-gray-700 px-3 py-2 border border-gray-300 rounded-lg"
            >
              Regenerate
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Re-submitting with the same key is safe — HMRC will return the existing receipt.
          </p>
        </div>

        {importId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
            VAT totals will be aggregated from approved import <span className="font-mono">{importId}</span>.
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-[#C9A64A] hover:bg-[#B8954A] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
          ) : (
            <><Send className="w-4 h-4" /> Submit to HMRC</>
          )}
        </button>
      </form>

      {/* Result */}
      {result && (
        <div className="mt-4">
          {result.status === 'accepted' && result.receipt && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-800">Submission Accepted</span>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <dt className="text-gray-600">Form Bundle Number</dt>
                <dd className="font-mono font-medium text-gray-900">{result.receipt.formBundleNumber}</dd>
                <dt className="text-gray-600">Processing Date</dt>
                <dd className="text-gray-900">{result.receipt.processingDate}</dd>
                <dt className="text-gray-600">Correlation ID</dt>
                <dd className="font-mono text-gray-700 text-xs">{result.receipt.correlationId}</dd>
              </dl>
            </div>
          )}

          {result.validationErrors && result.validationErrors.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-800">Validation Errors</span>
              </div>
              <ul className="space-y-1">
                {result.validationErrors.map((e) => (
                  <li key={e.code} className="text-xs text-amber-700">
                    <span className="font-mono font-medium">[{e.code}]</span> {e.message}
                    {' '}
                    <a href={e.kbArticle} target="_blank" rel="noreferrer" className="underline">KB</a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
              {result.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
