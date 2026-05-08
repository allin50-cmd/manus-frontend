import ClerkOSLayout from '@/components/layout/ClerkOSLayout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import { FileText, AlertCircle, Upload, CheckCircle2, Circle } from 'lucide-react';
import { useState, useRef } from 'react';
import { toast } from 'sonner';

function formatBytes(bytes?: number | null) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const DOC_TYPES = [
  'pleading', 'evidence', 'witness statement', 'order', 'judgment',
  'correspondence', 'exhibit', 'affidavit', 'bundle', 'other',
];

function UploadDialog({
  open,
  onOpenChange,
  caseId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  caseId: number;
}) {
  const utils = trpc.useContext();
  const create = trpc.documents.create.useMutation({
    onSuccess: () => {
      utils.documents.getByCaseId.invalidate({ caseId });
      onOpenChange(false);
      toast.success('Document registered');
    },
    onError: (e) => toast.error(e.message),
  });

  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('evidence');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { toast.error('Select a file'); return; }
    create.mutate({
      caseId,
      fileName: file.name,
      fileUrl: '',
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size,
      documentType,
      uploadedBy: 1,
    });
  };

  const inputClass =
    'w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>Register a document to this case.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={[
              'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
              file
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/10'
                : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/5',
            ].join(' ')}
          >
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate max-w-[240px]">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
                </div>
              </div>
            ) : (
              <div>
                <Upload className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Drag & drop or <span className="text-blue-600 dark:text-blue-400">browse</span>
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  PDF, DOCX, JPEG, PNG
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Document Type *
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className={inputClass}
            >
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={create.isLoading || !file}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {create.isLoading ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Documents() {
  const [caseId, setCaseId] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const { data: cases = [] } = trpc.cases.list.useQuery(undefined, { retry: false });
  const utils = trpc.useContext();

  const { data: docs = [], isLoading, error } = trpc.documents.getByCaseId.useQuery(
    { caseId: caseId! },
    { enabled: caseId !== null, retry: false },
  );

  const approveMutation = trpc.documents.approveForBundle.useMutation({
    onSuccess: () => utils.documents.getByCaseId.invalidate({ caseId: caseId! }),
    onError: (e) => toast.error(e.message),
  });

  return (
    <ClerkOSLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Documents</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Evidence & bundle surface — documents indexed by case
            </p>
          </div>
          {caseId && (
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
          )}
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
            value={caseId ?? ''}
            onChange={(e) => setCaseId(e.target.value ? Number(e.target.value) : null)}
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

        {/* Bundle summary */}
        {docs.length > 0 && (
          <div className="mb-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>
              {docs.filter((d) => d.approvedForBundle).length} of {docs.length} approved for bundle
            </span>
          </div>
        )}

        {/* Documents table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                {['File Name', 'Type', 'Document Type', 'Size', 'Uploaded', 'Bundle'].map((h) => (
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
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">
                    Select a case to view its documents
                  </td>
                </tr>
              ) : isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : docs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">
                    No documents for this case —{' '}
                    <button
                      onClick={() => setShowUpload(true)}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      upload one
                    </button>
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
                      {d.fileType.split('/').pop()}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 capitalize">{d.documentType}</td>
                    <td className="px-4 py-3 text-slate-400 dark:text-slate-500">
                      {formatBytes(d.fileSize)}
                    </td>
                    <td className="px-4 py-3 text-slate-400 dark:text-slate-500 text-xs">
                      {new Date(d.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          approveMutation.mutate({ id: d.id, approved: !d.approvedForBundle })
                        }
                        disabled={approveMutation.isLoading}
                        title={d.approvedForBundle ? 'Revoke bundle approval' : 'Approve for bundle'}
                        className="disabled:opacity-50 transition-colors"
                      >
                        {d.approvedForBundle ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-slate-400" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {caseId && (
        <UploadDialog open={showUpload} onOpenChange={setShowUpload} caseId={caseId} />
      )}
    </ClerkOSLayout>
  );
}
