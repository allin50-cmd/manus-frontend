import { useState, useRef } from 'react';
import {
  FolderOpen, Upload, Search, Download, Eye, Trash2,
  FileText, Image, Table, Filter, Calendar
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockDocuments } from '@/lib/mockData';
import { formatDate, formatFileSize } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { VaultDocument, DocumentCategory } from '@/types/fineguard';

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  receipts: 'Receipts',
  invoices: 'Invoices',
  accounts: 'Accounts',
  company_documents: 'Company Docs',
  tax_filings: 'Tax Filings',
  contracts: 'Contracts',
};

const CATEGORY_COLORS: Record<DocumentCategory, string> = {
  receipts: 'bg-blue-50 text-blue-700',
  invoices: 'bg-green-50 text-green-700',
  accounts: 'bg-purple-50 text-purple-700',
  company_documents: 'bg-gray-50 text-gray-700',
  tax_filings: 'bg-red-50 text-red-700',
  contracts: 'bg-amber-50 text-amber-700',
};

const FILE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pdf: FileText,
  image: Image,
  csv: Table,
  excel: Table,
};

export default function Documents() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [docs] = useState(mockDocuments);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const years = [...new Set(docs.map(d => d.year.toString()))].sort((a, b) => b.localeCompare(a));

  const filtered = docs.filter(d => {
    const matchSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchYear = yearFilter === 'all' || d.year.toString() === yearFilter;
    const matchCategory = categoryFilter === 'all' || d.category === categoryFilter;
    return matchSearch && matchYear && matchCategory;
  });

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Document Vault"
        description="Secure storage for all company documents"
        actions={
          <button
            onClick={() => fileRef.current?.click()}
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" /> Upload Document
          </button>
        }
      />

      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={() => alert('Upload triggered! In production this would store to the document vault.')}
      />

      {/* Category Summary */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
        {(Object.entries(CATEGORY_LABELS) as [DocumentCategory, string][]).map(([cat, label]) => {
          const count = docs.filter(d => d.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(p => p === cat ? 'all' : cat)}
              className={cn(
                'card p-3 text-center transition-all',
                categoryFilter === cat ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
              )}
            >
              <p className={cn('text-lg font-bold font-mono')}>{count}</p>
              <p className={cn(
                'text-xs font-medium px-1.5 py-0.5 rounded mt-1',
                CATEGORY_COLORS[cat]
              )}>
                {label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="card mb-4 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search documents..."
              className="input pl-9"
            />
          </div>
          <select
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="all">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="all">All Categories</option>
            {(Object.entries(CATEGORY_LABELS) as [string, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-3 card p-16 text-center">
            <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400">No documents found</p>
          </div>
        ) : (
          filtered.map(doc => (
            <DocumentCard key={doc.id} doc={doc} />
          ))
        )}
      </div>
    </div>
  );
}

function DocumentCard({ doc }: { doc: VaultDocument }) {
  const Icon = FILE_ICONS[doc.fileType] ?? FileText;

  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 mb-3">
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
          CATEGORY_COLORS[doc.category]
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{doc.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {doc.fileType.toUpperCase()} · {formatFileSize(doc.fileSize)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className={cn(
          'text-xs font-medium px-2 py-0.5 rounded',
          CATEGORY_COLORS[doc.category]
        )}>
          {CATEGORY_LABELS[doc.category]}
        </span>
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Calendar className="w-3 h-3" />{doc.year}
        </span>
      </div>

      {doc.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{doc.description}</p>
      )}

      {doc.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {doc.tags.map(tag => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-400">{formatDate(doc.uploadedAt)}</p>
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <Eye className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors">
            <Download className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
