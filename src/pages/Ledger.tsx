import { useState } from 'react';
import { Plus, Filter, Download, CheckCircle, Lock, Edit2, Search } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockLedgerEntries } from '@/lib/mockData';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { LedgerEntry, TransactionType } from '@/types/fineguard';

const TYPE_COLORS: Record<TransactionType, string> = {
  sales: 'bg-green-100 text-green-800',
  purchase: 'bg-blue-100 text-blue-800',
  adjustment: 'bg-amber-100 text-amber-800',
};

export default function Ledger() {
  const [entries, setEntries] = useState(mockLedgerEntries);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = entries.filter(e => {
    const matchSearch =
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.supplier.toLowerCase().includes(search.toLowerCase()) ||
      (e.invoiceNumber ?? '').toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || e.type === typeFilter;
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const totals = filtered.reduce(
    (acc, e) => ({
      net: acc.net + e.net,
      vat: acc.vat + e.vat,
      gross: acc.gross + e.gross,
    }),
    { net: 0, vat: 0, gross: 0 }
  );

  const handleVerify = (id: string) => {
    setEntries(prev =>
      prev.map(e =>
        e.id === id
          ? { ...e, status: 'verified' as const, verifiedBy: 'Current User', verifiedAt: new Date().toISOString() }
          : e
      )
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Ledger"
        description="Transaction ledger with full audit trail"
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-secondary text-xs flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button className="btn-primary text-xs flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> New Entry
            </button>
          </div>
        }
      />

      {/* Filters */}
      <div className="card mb-4 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search entries..."
              className="input pl-9"
            />
          </div>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="all">All Types</option>
            <option value="sales">Sales</option>
            <option value="purchase">Purchase</option>
            <option value="adjustment">Adjustment</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="all">All Status</option>
            <option value="unverified">Unverified</option>
            <option value="verified">Verified</option>
            <option value="locked">Locked</option>
          </select>
        </div>
      </div>

      {/* Summary totals */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Net Total', value: totals.net, muted: true },
          { label: 'VAT Total', value: totals.vat, muted: false },
          { label: 'Gross Total', value: totals.gross, bold: true },
        ].map(({ label, value, bold }) => (
          <div key={label} className="card p-3 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
            <p className={cn('text-lg font-mono mt-1', bold ? 'font-bold text-gray-900' : 'font-medium text-gray-700')}>
              {formatCurrency(value)}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Supplier</th>
                <th className="text-right">Net</th>
                <th className="text-right">VAT</th>
                <th className="text-right">Gross</th>
                <th>Type</th>
                <th>Source</th>
                <th>Status</th>
                <th>Verified By</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-10 text-gray-400">
                    No entries found
                  </td>
                </tr>
              ) : (
                filtered.map(entry => (
                  <LedgerRow key={entry.id} entry={entry} onVerify={handleVerify} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LedgerRow({
  entry,
  onVerify,
}: {
  entry: LedgerEntry;
  onVerify: (id: string) => void;
}) {
  const isLocked = entry.status === 'locked';
  const isVerified = entry.status === 'verified' || isLocked;

  return (
    <tr className={cn(isLocked && 'bg-gray-50 opacity-75')}>
      <td className="whitespace-nowrap text-xs text-gray-500">{formatDate(entry.date)}</td>
      <td>
        <div className="max-w-[200px]">
          <p className="text-sm text-gray-900 truncate">{entry.description}</p>
          {entry.invoiceNumber && (
            <p className="text-xs text-gray-400 font-mono">{entry.invoiceNumber}</p>
          )}
        </div>
      </td>
      <td className="text-sm text-gray-700">{entry.supplier}</td>
      <td className="text-right font-mono text-sm text-gray-700">
        {formatCurrency(entry.net)}
      </td>
      <td className="text-right font-mono text-sm text-gray-700">
        {formatCurrency(entry.vat)}
      </td>
      <td className="text-right font-mono text-sm font-medium text-gray-900">
        {formatCurrency(entry.gross)}
      </td>
      <td>
        <span className={cn(
          'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize',
          TYPE_COLORS[entry.type]
        )}>
          {entry.type}
        </span>
      </td>
      <td>
        <span className="badge badge-gray capitalize">{entry.source}</span>
      </td>
      <td>
        <StatusBadge status={entry.status} />
      </td>
      <td className="text-xs text-gray-500">
        {entry.verifiedBy ? (
          <div>
            <p>{entry.verifiedBy}</p>
            {entry.verifiedAt && (
              <p className="text-gray-400">{formatDate(entry.verifiedAt)}</p>
            )}
          </div>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </td>
      <td>
        {!isLocked && (
          <div className="flex items-center gap-1">
            {!isVerified ? (
              <button
                onClick={() => onVerify(entry.id)}
                className="p-1 rounded text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                title="Verify entry"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            ) : (
              <button
                className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                title="Edit entry"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        {isLocked && (
          <span title="Locked — immutable"><Lock className="w-4 h-4 text-gray-300" /></span>
        )}
      </td>
    </tr>
  );
}
