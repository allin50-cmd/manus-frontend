import { useState } from 'react';
import { ClipboardList, Search, Download, ChevronDown, ChevronRight } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { mockAuditLogs } from '@/lib/mockData';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { AuditLog } from '@/types/fineguard';

const ACTION_COLORS: Record<string, string> = {
  LEDGER_ENTRY_VERIFIED: 'text-green-700 bg-green-50',
  LEDGER_ENTRY_CREATED: 'text-blue-700 bg-blue-50',
  LEDGER_ENTRY_LOCKED: 'text-purple-700 bg-purple-50',
  VAT_RETURN_VALIDATED: 'text-blue-700 bg-blue-50',
  VAT_RETURN_SUBMITTED: 'text-green-700 bg-green-50',
  RECEIPT_UPLOADED: 'text-blue-700 bg-blue-50',
  RECEIPT_APPROVED: 'text-green-700 bg-green-50',
  RECEIPT_REJECTED: 'text-red-700 bg-red-50',
  USER_LOGIN: 'text-gray-700 bg-gray-50',
  SETTINGS_CHANGED: 'text-amber-700 bg-amber-50',
};

export default function AuditTrail() {
  const [logs] = useState(mockAuditLogs);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = logs.filter(l =>
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.userName.toLowerCase().includes(search.toLowerCase()) ||
    l.entityType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Audit Trail"
        description="Complete immutable log of all system actions for compliance investigations"
        actions={
          <button className="btn-secondary text-xs flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export Log
          </button>
        }
      />

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-2">
        <ClipboardList className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          <strong>Immutable Audit Trail.</strong> All actions are cryptographically signed and cannot be modified.
          This log supports compliance investigations and HMRC enquiries.
        </p>
      </div>

      {/* Search */}
      <div className="card mb-4 p-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by action, user, or entity..."
            className="input pl-9 text-sm"
          />
        </div>
      </div>

      {/* Log entries */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>IP Address</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                filtered.map(log => (
                  <AuditRow
                    key={log.id}
                    log={log}
                    expanded={expandedId === log.id}
                    onToggle={() => setExpandedId(p => p === log.id ? null : log.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AuditRow({
  log,
  expanded,
  onToggle,
}: {
  log: AuditLog;
  expanded: boolean;
  onToggle: () => void;
}) {
  const actionStyle = ACTION_COLORS[log.action] ?? 'text-gray-700 bg-gray-50';

  return (
    <>
      <tr className="cursor-pointer" onClick={onToggle}>
        <td className="whitespace-nowrap text-xs font-mono text-gray-500">
          {formatDateTime(log.timestamp)}
        </td>
        <td>
          <div>
            <p className="text-sm font-medium text-gray-900">{log.userName}</p>
            <p className="text-xs text-gray-400">{log.userId}</p>
          </div>
        </td>
        <td>
          <span className={cn(
            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium font-mono',
            actionStyle
          )}>
            {log.action}
          </span>
        </td>
        <td className="text-sm text-gray-700">
          <span className="text-xs font-mono">
            {log.entityType}#{log.entityId}
          </span>
        </td>
        <td className="text-xs font-mono text-gray-400">{log.ipAddress}</td>
        <td>
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50">
          <td colSpan={6} className="px-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              {log.beforeValue && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Before</p>
                  <pre className="text-xs font-mono bg-white p-2 rounded border border-gray-200 overflow-auto">
                    {JSON.stringify(log.beforeValue, null, 2)}
                  </pre>
                </div>
              )}
              {log.afterValue && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">After</p>
                  <pre className="text-xs font-mono bg-white p-2 rounded border border-green-200 overflow-auto">
                    {JSON.stringify(log.afterValue, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
