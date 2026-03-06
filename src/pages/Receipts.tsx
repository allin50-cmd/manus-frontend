import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, ScanLine, FileText, Image, Table,
  AlertCircle, CheckCircle, Clock, Search, Download
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import ConfidenceBar from '@/components/ui/ConfidenceBar';
import { mockReceipts } from '@/lib/mockData';
import { formatCurrency, formatDate, formatFileSize } from '@/lib/utils';
import { cn } from '@/lib/utils';

const FILE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pdf: FileText,
  image: Image,
  csv: Table,
  excel: Table,
};

export default function Receipts() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [receipts] = useState(mockReceipts);
  const [search, setSearch] = useState('');

  const filtered = receipts.filter(r =>
    r.fileName.toLowerCase().includes(search.toLowerCase()) ||
    (r.extractedFields?.supplier ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // In production: upload file to /api/files/upload
    alert('File dropped! In production this would upload to the API for OCR processing.');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      alert(`Selected: ${file.name}. In production this would trigger OCR processing.`);
    }
  };

  const stats = {
    total: receipts.length,
    verified: receipts.filter(r => r.status === 'verified').length,
    pending: receipts.filter(r => r.status === 'extracted' || r.status === 'uploaded').length,
    duplicates: receipts.filter(r => r.status === 'duplicate').length,
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Receipts"
        description="Upload, scan and manage all business receipts"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/scan')}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <ScanLine className="w-3.5 h-3.5" /> Scan Receipt
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" /> Upload File
            </button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-900' },
          { label: 'Verified', value: stats.verified, color: 'text-green-700' },
          { label: 'Pending Review', value: stats.pending, color: 'text-amber-700' },
          { label: 'Duplicates', value: stats.duplicates, color: 'text-red-700' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className={cn('text-2xl font-bold font-mono', s.color)}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Upload Area */}
      <div
        className={cn(
          'card mb-6 p-8 border-2 border-dashed text-center transition-colors cursor-pointer',
          isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        )}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleFileDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.csv,.xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Upload className="w-8 h-8 text-gray-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-700">
          Drop files here or <span className="text-blue-600">browse</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Supports PDF, images (JPG, PNG), Excel, and CSV
        </p>
        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> PDF</span>
          <span className="flex items-center gap-1"><Image className="w-3 h-3" /> JPG/PNG</span>
          <span className="flex items-center gap-1"><Table className="w-3 h-3" /> Excel/CSV</span>
        </div>
      </div>

      {/* Search */}
      <div className="card mb-4 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by supplier or filename..."
            className="input pl-9"
          />
        </div>
      </div>

      {/* Receipts Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>File</th>
                <th>Supplier</th>
                <th>Date Uploaded</th>
                <th className="text-right">Net</th>
                <th className="text-right">VAT</th>
                <th className="text-right">Gross</th>
                <th>Confidence</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-gray-400">
                    No receipts found
                  </td>
                </tr>
              ) : (
                filtered.map(receipt => {
                  const Icon = FILE_ICONS[receipt.fileType] ?? FileText;
                  return (
                    <tr key={receipt.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-gray-900 truncate max-w-[160px]">
                              {receipt.fileName}
                            </p>
                            <p className="text-xs text-gray-400">{receipt.fileType.toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-sm text-gray-700">
                        {receipt.extractedFields?.supplier ?? '—'}
                      </td>
                      <td className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(receipt.uploadedAt)}
                      </td>
                      <td className="text-right font-mono text-sm text-gray-700">
                        {receipt.extractedFields ? formatCurrency(receipt.extractedFields.net) : '—'}
                      </td>
                      <td className="text-right font-mono text-sm text-gray-700">
                        {receipt.extractedFields ? formatCurrency(receipt.extractedFields.vat) : '—'}
                      </td>
                      <td className="text-right font-mono text-sm font-medium text-gray-900">
                        {receipt.extractedFields ? formatCurrency(receipt.extractedFields.gross) : '—'}
                      </td>
                      <td>
                        {receipt.extractedFields ? (
                          <div className="w-24">
                            <ConfidenceBar
                              confidence={receipt.extractedFields.confidence}
                              showLabel={false}
                              threshold={98}
                            />
                            <p className="text-xs text-gray-500 mt-0.5">
                              {receipt.extractedFields.confidence.toFixed(1)}%
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" /> Processing...
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={receipt.status} size="sm" />
                          {receipt.isDuplicate && (
                            <span title="Duplicate detected" className="text-red-500">
                              <AlertCircle className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {receipt.status === 'extracted' && (
                          <button className="btn-primary text-xs py-1 px-2">
                            Review
                          </button>
                        )}
                        {receipt.status === 'verified' && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
