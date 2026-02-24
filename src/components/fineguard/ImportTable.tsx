/**
 * Import Table Component
 * Displays the list of CSV/PDF imports with status badges and action buttons.
 */
import React from 'react';
import { FileText, FileSpreadsheet, CheckCircle, Clock, XCircle, AlertTriangle, ChevronRight } from 'lucide-react';
import type { Import } from '@/services/mtdApi';

interface ImportTableProps {
  imports: Import[];
  onViewRecords: (importId: string) => void;
  onApprove: (importId: string) => void;
  loading?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending:    { label: 'Pending',    color: 'bg-gray-100 text-gray-700',    icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-700',    icon: Clock },
  validated:  { label: 'Validated',  color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
  approved:   { label: 'Approved',   color: 'bg-green-100 text-green-700',   icon: CheckCircle },
  submitted:  { label: 'Submitted',  color: 'bg-purple-100 text-purple-700', icon: CheckCircle },
  failed:     { label: 'Failed',     color: 'bg-red-100 text-red-700',       icon: XCircle },
  error:      { label: 'Error',      color: 'bg-red-100 text-red-700',       icon: XCircle },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

export default function ImportTable({ imports, onViewRecords, onApprove, loading }: ImportTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <Clock className="w-5 h-5 animate-spin mr-2" />
        Loading imports…
      </div>
    );
  }

  if (imports.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No imports yet. Upload a CSV or PDF to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['File', 'Source', 'Status', 'Records', 'Errors', 'Confidence', 'Date', 'Actions'].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {imports.map((imp) => (
            <tr key={imp.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">
                <div className="flex items-center gap-2">
                  {imp.source === 'pdf' ? (
                    <FileText className="w-4 h-4 text-red-500 shrink-0" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4 text-green-600 shrink-0" />
                  )}
                  <span className="truncate">{imp.filename ?? '—'}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-600 uppercase text-xs">{imp.source}</td>
              <td className="px-4 py-3">
                <StatusBadge status={imp.status} />
              </td>
              <td className="px-4 py-3 text-gray-700">{imp.recordCount ?? '—'}</td>
              <td className="px-4 py-3">
                {imp.errorCount != null && imp.errorCount > 0 ? (
                  <span className="text-red-600 font-medium">{imp.errorCount}</span>
                ) : (
                  <span className="text-gray-400">{imp.errorCount ?? '—'}</span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-700">
                {imp.confidenceAvg != null
                  ? `${Math.round(parseFloat(imp.confidenceAvg) * 100)}%`
                  : '—'}
              </td>
              <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                {new Date(imp.createdAt).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewRecords(imp.id)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-0.5"
                  >
                    View <ChevronRight className="w-3 h-3" />
                  </button>
                  {imp.status === 'validated' && (
                    <button
                      onClick={() => onApprove(imp.id)}
                      className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded font-medium"
                    >
                      Approve
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
