import ClerkOSLayout from '@/components/layout/ClerkOSLayout';
import { trpc } from '@/lib/trpc';
import { FileText, AlertCircle } from 'lucide-react';
import { useState } from 'react';

function formatBytes(bytes?: number | null) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Documents() {
  const [caseId, setCaseId] = useState<number | null>(null);
  const [caseIdInput, setCaseIdInput] = useState('');

  const { data: cases = [] } = trpc.cases.list.useQuery(undefined, { retry: false });

  const { data: docs = [], isLoading, error } = trpc.documents.getByCaseId.useQuery(
    { caseId: caseId! },
    { enabled: caseId !== null, retry: false },
  );

  const handleCaseSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setCaseId(val ? Number(val) : null);
    setCaseIdInput(val);
  };

  return (
    <ClerkOSLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Documents</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Evidence & bundle surface — documents indexed by case
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Database not connected — no documents to display.
            </p>
          </div>
        )}

        {/* Case selector */}
        <div className="mb-5 max-w-sm">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            Select Case
          </label>
          <select
            value={caseIdInput}
            onChange={handleCaseSelect}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Choose a case —</option>
            {cases.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.referenceNumber} · {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* Documents table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                {['File Name', 'Type', 'Document Type', 'Size', 'Uploaded'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {!caseId ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-sm">
                    Select a case to view its documents
                  </td>
                </tr>
              ) : isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-sm">
                    Loading…
                  </td>
                </tr>
              ) : docs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-sm">
                    No documents for this case
                  </td>
                </tr>
              ) : (
                docs.map((d) => (
                  <tr
                    key={d.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[200px]">
                          {d.fileName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 uppercase text-xs">
                      {d.fileType}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{d.documentType}</td>
                    <td className="px-4 py-3 text-slate-400 dark:text-slate-500">
                      {formatBytes(d.fileSize)}
                    </td>
                    <td className="px-4 py-3 text-slate-400 dark:text-slate-500 text-xs">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ClerkOSLayout>
  );
}
