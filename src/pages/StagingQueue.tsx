import { useState } from 'react';
import { CheckCircle, XCircle, Eye, AlertTriangle, Clock, Layers } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import ConfidenceBar from '@/components/ui/ConfidenceBar';
import { mockStagingItems } from '@/lib/mockData';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { StagingItem, ExtractedFields } from '@/types/fineguard';

export default function StagingQueue() {
  const [items, setItems] = useState(mockStagingItems);
  const [selectedItem, setSelectedItem] = useState<StagingItem | null>(
    mockStagingItems[0] ?? null
  );
  const [editedFields, setEditedFields] = useState<ExtractedFields | null>(
    mockStagingItems[0]?.extractedFields ?? null
  );
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const pendingItems = items.filter(i => i.status === 'pending');
  const processedItems = items.filter(i => i.status !== 'pending');

  const selectItem = (item: StagingItem) => {
    setSelectedItem(item);
    setEditedFields({ ...item.extractedFields });
    setShowRejectForm(false);
    setRejectionReason('');
  };

  const handleApprove = () => {
    if (!selectedItem || !editedFields) return;
    setItems(prev =>
      prev.map(i =>
        i.id === selectedItem.id
          ? { ...i, status: 'approved' as const, reviewedAt: new Date().toISOString(), reviewedBy: 'Current User' }
          : i
      )
    );
    const next = pendingItems.find(i => i.id !== selectedItem.id);
    setSelectedItem(next ?? null);
    setEditedFields(next?.extractedFields ?? null);
  };

  const handleReject = () => {
    if (!selectedItem || !rejectionReason.trim()) return;
    setItems(prev =>
      prev.map(i =>
        i.id === selectedItem.id
          ? { ...i, status: 'rejected' as const, rejectionReason, reviewedAt: new Date().toISOString() }
          : i
      )
    );
    setShowRejectForm(false);
    setRejectionReason('');
    const next = pendingItems.find(i => i.id !== selectedItem.id);
    setSelectedItem(next ?? null);
    setEditedFields(next?.extractedFields ?? null);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Staging Queue"
        description="Review and approve receipts before they enter the ledger"
        actions={
          <div className="flex items-center gap-2 text-sm">
            <span className="badge badge-amber">{pendingItems.length} pending</span>
            <span className="badge badge-green">{items.filter(i => i.status === 'approved').length} approved</span>
          </div>
        }
      />

      {pendingItems.length === 0 ? (
        <div className="card p-16 text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Staging Queue Clear</h2>
          <p className="text-gray-500">
            All receipts have been reviewed. No items pending verification.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Queue List */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="card-header">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-gray-500" />
                  <h2 className="text-sm font-semibold text-gray-900">Pending Review</h2>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {pendingItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => selectItem(item)}
                    className={cn(
                      'w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors',
                      selectedItem?.id === item.id && 'bg-blue-50 border-r-2 border-blue-600'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.extractedFields.supplier}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatCurrency(item.extractedFields.gross)} · {formatDate(item.extractedFields.date)}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {item.extractedFields.confidence < 98 ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        )}
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            item.extractedFields.confidence >= 98 ? 'bg-green-500' :
                            item.extractedFields.confidence >= 90 ? 'bg-amber-500' : 'bg-red-500'
                          )}
                          style={{ width: `${item.extractedFields.confidence}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.extractedFields.confidence.toFixed(1)}% confidence
                      </p>
                    </div>
                  </button>
                ))}

                {processedItems.length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-gray-50">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                        Processed ({processedItems.length})
                      </p>
                    </div>
                    {processedItems.map(item => (
                      <div
                        key={item.id}
                        className="px-4 py-3 flex items-center justify-between opacity-60"
                      >
                        <div>
                          <p className="text-sm text-gray-600 truncate">
                            {item.extractedFields.supplier}
                          </p>
                          <p className="text-xs text-gray-400">{formatCurrency(item.extractedFields.gross)}</p>
                        </div>
                        <StatusBadge status={item.status} size="sm" />
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-2">
            {selectedItem && editedFields ? (
              <div className="space-y-4">
                {/* Confidence */}
                <div className="card p-4">
                  <ConfidenceBar confidence={editedFields.confidence} threshold={98} />
                </div>

                {/* Document Preview */}
                <div className="card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-900">Document Preview</h3>
                  </div>
                  <div className="bg-gray-100 rounded-lg h-32 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <Eye className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-xs">{selectedItem.receipt.fileName}</p>
                    </div>
                  </div>
                </div>

                {/* Extracted Fields */}
                <div className="card p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Extracted Fields
                    {editedFields.confidence < 98 && (
                      <span className="ml-2 text-xs text-amber-600 font-normal">
                        (requires manual verification)
                      </span>
                    )}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Supplier *</label>
                      <input
                        type="text"
                        value={editedFields.supplier}
                        onChange={e => setEditedFields(p => p ? { ...p, supplier: e.target.value } : null)}
                        className="input"
                        disabled={selectedItem.status !== 'pending'}
                      />
                    </div>
                    <div>
                      <label className="label">Date *</label>
                      <input
                        type="date"
                        value={editedFields.date}
                        onChange={e => setEditedFields(p => p ? { ...p, date: e.target.value } : null)}
                        className="input"
                        disabled={selectedItem.status !== 'pending'}
                      />
                    </div>
                    <div>
                      <label className="label">Invoice Number</label>
                      <input
                        type="text"
                        value={editedFields.invoiceNumber}
                        onChange={e => setEditedFields(p => p ? { ...p, invoiceNumber: e.target.value } : null)}
                        className="input font-mono text-sm"
                        disabled={selectedItem.status !== 'pending'}
                      />
                    </div>
                    <div>
                      <label className="label">VAT Rate</label>
                      <select
                        value={editedFields.vatRate}
                        onChange={e => setEditedFields(p => p ? { ...p, vatRate: parseInt(e.target.value) } : null)}
                        className="input"
                        disabled={selectedItem.status !== 'pending'}
                      >
                        <option value={20}>Standard 20%</option>
                        <option value={5}>Reduced 5%</option>
                        <option value={0}>Zero-rated 0%</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Net (£) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editedFields.net}
                        onChange={e => setEditedFields(p => p ? { ...p, net: parseFloat(e.target.value) || 0 } : null)}
                        className="input font-mono"
                        disabled={selectedItem.status !== 'pending'}
                      />
                    </div>
                    <div>
                      <label className="label">VAT (£) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editedFields.vat}
                        onChange={e => setEditedFields(p => p ? { ...p, vat: parseFloat(e.target.value) || 0 } : null)}
                        className="input font-mono"
                        disabled={selectedItem.status !== 'pending'}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="label">Gross (£) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editedFields.gross}
                        className="input font-mono bg-gray-50 font-bold"
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {selectedItem.status === 'pending' && (
                  <div className="flex gap-3">
                    {showRejectForm ? (
                      <div className="flex-1 card p-4 space-y-3">
                        <label className="label text-red-700">Rejection Reason *</label>
                        <textarea
                          value={rejectionReason}
                          onChange={e => setRejectionReason(e.target.value)}
                          className="input h-20 resize-none"
                          placeholder="Explain why this receipt is being rejected..."
                        />
                        <div className="flex gap-2">
                          <button onClick={() => setShowRejectForm(false)} className="btn-secondary flex-1">
                            Cancel
                          </button>
                          <button
                            onClick={handleReject}
                            disabled={!rejectionReason.trim()}
                            className="btn-danger flex-1"
                          >
                            Confirm Reject
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setShowRejectForm(true)}
                          className="btn-danger flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                        <button
                          onClick={handleApprove}
                          disabled={editedFields.confidence < 98 && !showRejectForm}
                          className={cn(
                            'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all',
                            editedFields.confidence >= 98
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-amber-500 hover:bg-amber-600 text-white'
                          )}
                        >
                          <CheckCircle className="w-4 h-4" />
                          {editedFields.confidence >= 98 ? 'Approve & Add to Ledger' : 'Override & Approve'}
                        </button>
                      </>
                    )}
                  </div>
                )}

                {selectedItem.status !== 'pending' && (
                  <div className={cn(
                    'card p-4 flex items-center gap-3',
                    selectedItem.status === 'approved' ? 'bg-green-50' : 'bg-red-50'
                  )}>
                    {selectedItem.status === 'approved' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <p className={cn(
                        'text-sm font-medium',
                        selectedItem.status === 'approved' ? 'text-green-800' : 'text-red-800'
                      )}>
                        {selectedItem.status === 'approved' ? 'Approved and added to ledger' : 'Rejected'}
                      </p>
                      {selectedItem.rejectionReason && (
                        <p className="text-xs text-red-600 mt-0.5">{selectedItem.rejectionReason}</p>
                      )}
                      {selectedItem.reviewedAt && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDateTime(selectedItem.reviewedAt)}
                          {selectedItem.reviewedBy && ` by ${selectedItem.reviewedBy}`}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card p-16 text-center">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-400">Select an item from the queue to review</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
