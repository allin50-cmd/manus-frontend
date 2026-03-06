import { useState } from 'react';
import { GitMerge, Link, Scissors, Tag, FileQuestion, CheckCircle, Search } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockBankTransactions, mockLedgerEntries } from '@/lib/mockData';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { BankTransaction, LedgerEntry } from '@/types/fineguard';

export default function Reconciliation() {
  const [bankTxns, setBankTxns] = useState(mockBankTransactions);
  const [ledgerEntries] = useState(mockLedgerEntries);
  const [selectedBank, setSelectedBank] = useState<BankTransaction | null>(null);
  const [selectedLedger, setSelectedLedger] = useState<LedgerEntry | null>(null);
  const [search, setSearch] = useState('');

  const unmatched = bankTxns.filter(t => t.reconciliationStatus === 'unmatched');
  const matched = bankTxns.filter(t => t.reconciliationStatus === 'matched');

  const handleMatch = () => {
    if (!selectedBank || !selectedLedger) return;
    setBankTxns(prev =>
      prev.map(t =>
        t.id === selectedBank.id
          ? { ...t, reconciliationStatus: 'matched' as const, matchedLedgerIds: [selectedLedger.id] }
          : t
      )
    );
    setSelectedBank(null);
    setSelectedLedger(null);
  };

  const handleMarkNonVAT = (txId: string) => {
    setBankTxns(prev =>
      prev.map(t =>
        t.id === txId ? { ...t, reconciliationStatus: 'non_vat' as const } : t
      )
    );
  };

  const handleRequestReceipt = (txId: string) => {
    setBankTxns(prev =>
      prev.map(t =>
        t.id === txId ? { ...t, reconciliationStatus: 'pending_receipt' as const } : t
      )
    );
  };

  const filteredBank = bankTxns.filter(t =>
    t.description.toLowerCase().includes(search.toLowerCase()) ||
    t.reference.toLowerCase().includes(search.toLowerCase())
  );

  const filteredLedger = ledgerEntries.filter(e =>
    e.description.toLowerCase().includes(search.toLowerCase()) ||
    e.supplier.toLowerCase().includes(search.toLowerCase())
  );

  const summary = {
    total: bankTxns.length,
    matched: matched.length,
    unmatched: unmatched.length,
    nonVAT: bankTxns.filter(t => t.reconciliationStatus === 'non_vat').length,
    pendingReceipt: bankTxns.filter(t => t.reconciliationStatus === 'pending_receipt').length,
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Bank Reconciliation"
        description="Match bank transactions with ledger entries"
        actions={
          selectedBank && selectedLedger ? (
            <button
              onClick={handleMatch}
              className="btn-primary flex items-center gap-2 text-xs"
            >
              <Link className="w-3.5 h-3.5" /> Match Selected
            </button>
          ) : undefined
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total', value: summary.total, color: 'text-gray-900' },
          { label: 'Matched', value: summary.matched, color: 'text-green-700' },
          { label: 'Unmatched', value: summary.unmatched, color: 'text-amber-700' },
          { label: 'Non-VAT', value: summary.nonVAT, color: 'text-gray-500' },
          { label: 'Needs Receipt', value: summary.pendingReceipt, color: 'text-blue-700' },
        ].map(s => (
          <div key={s.label} className="card p-3 text-center">
            <p className={cn('text-xl font-bold font-mono', s.color)}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Match instruction */}
      {(selectedBank || selectedLedger) && (
        <div className="card mb-4 p-3 bg-blue-50 border-blue-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Link className="w-4 h-4" />
            {selectedBank && !selectedLedger && 'Now select a ledger entry to match'}
            {!selectedBank && selectedLedger && 'Now select a bank transaction to match'}
            {selectedBank && selectedLedger && 'Both selected — click Match to confirm'}
          </div>
          <button
            onClick={() => { setSelectedBank(null); setSelectedLedger(null); }}
            className="text-xs text-blue-600 hover:underline"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Search */}
      <div className="card mb-4 p-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="input pl-9 text-sm"
          />
        </div>
      </div>

      {/* Two-column reconciliation view */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bank Transactions */}
        <div className="card">
          <div className="card-header bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">Bank Transactions</h2>
            <p className="text-xs text-gray-400 mt-0.5">Click to select for matching</p>
          </div>
          <div className="divide-y divide-gray-50">
            {filteredBank.map(tx => (
              <BankTxRow
                key={tx.id}
                tx={tx}
                isSelected={selectedBank?.id === tx.id}
                onClick={() => {
                  if (tx.reconciliationStatus === 'unmatched') {
                    setSelectedBank(p => p?.id === tx.id ? null : tx);
                  }
                }}
                onMarkNonVAT={() => handleMarkNonVAT(tx.id)}
                onRequestReceipt={() => handleRequestReceipt(tx.id)}
              />
            ))}
          </div>
        </div>

        {/* Ledger Entries */}
        <div className="card">
          <div className="card-header bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">Ledger Entries</h2>
            <p className="text-xs text-gray-400 mt-0.5">Click to select for matching</p>
          </div>
          <div className="divide-y divide-gray-50">
            {filteredLedger.map(entry => (
              <LedgerEntryRow
                key={entry.id}
                entry={entry}
                isSelected={selectedLedger?.id === entry.id}
                onClick={() => setSelectedLedger(p => p?.id === entry.id ? null : entry)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BankTxRow({
  tx,
  isSelected,
  onClick,
  onMarkNonVAT,
  onRequestReceipt,
}: {
  tx: BankTransaction;
  isSelected: boolean;
  onClick: () => void;
  onMarkNonVAT: () => void;
  onRequestReceipt: () => void;
}) {
  return (
    <div
      className={cn(
        'px-4 py-3 transition-colors',
        tx.reconciliationStatus === 'unmatched' && 'cursor-pointer hover:bg-gray-50',
        isSelected && 'bg-blue-50 border-l-4 border-blue-500'
      )}
      onClick={tx.reconciliationStatus === 'unmatched' ? onClick : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{tx.description}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatDate(tx.date)} · {tx.reference}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className={cn(
            'text-sm font-mono font-medium',
            tx.type === 'credit' ? 'text-green-700' : 'text-gray-900'
          )}>
            {tx.type === 'credit' ? '+' : '−'}{formatCurrency(tx.amount)}
          </p>
          <StatusBadge status={tx.reconciliationStatus} size="sm" />
        </div>
      </div>

      {tx.reconciliationStatus === 'unmatched' && !isSelected && (
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={e => { e.stopPropagation(); onMarkNonVAT(); }}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <Tag className="w-3 h-3" /> Non-VAT
          </button>
          <button
            onClick={e => { e.stopPropagation(); onRequestReceipt(); }}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <FileQuestion className="w-3 h-3" /> Request Receipt
          </button>
        </div>
      )}

      {tx.reconciliationStatus === 'matched' && (
        <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
          <CheckCircle className="w-3 h-3" />
          Matched to {tx.matchedLedgerIds.length} ledger entr{tx.matchedLedgerIds.length === 1 ? 'y' : 'ies'}
        </div>
      )}
    </div>
  );
}

function LedgerEntryRow({
  entry,
  isSelected,
  onClick,
}: {
  entry: LedgerEntry;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={cn(
        'px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors',
        isSelected && 'bg-blue-50 border-l-4 border-blue-500'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{entry.description}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {entry.supplier} · {formatDate(entry.date)}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-mono font-medium text-gray-900">
            {formatCurrency(entry.gross)}
          </p>
          <StatusBadge status={entry.type} size="sm" />
        </div>
      </div>
    </div>
  );
}
