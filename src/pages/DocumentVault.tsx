import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FolderLock, Upload, FileText, Trash2, Download, Search,
  ArrowLeft, Loader2, Filter, Calendar, Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navbar from '@/components/Navbar';
import { authFetch } from '@/lib/auth';
import { toast } from 'sonner';

interface Document {
  id: string;
  fileName: string;
  originalName: string;
  documentType?: string;
  fileSize?: number;
  mimeType?: string;
  fileUrl?: string;
  retentionUntil?: string;
  createdAt: string;
  companyName?: string;
}

const DOC_TYPES = [
  { value: 'vat_return', label: 'VAT Return' },
  { value: 'annual_accounts', label: 'Annual Accounts' },
  { value: 'confirmation_statement', label: 'Confirmation Statement' },
  { value: 'correspondence', label: 'Correspondence' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'payroll', label: 'Payroll Records' },
  { value: 'other', label: 'Other' },
];

function formatFileSize(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getDocIcon(mimeType?: string) {
  if (mimeType?.includes('pdf')) return '📄';
  if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return '📊';
  if (mimeType?.includes('csv')) return '📋';
  return '📁';
}

export default function DocumentVault() {
  const { companyId } = useParams();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('other');
  const [showUpload, setShowUpload] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const url = companyId ? `/api/documents?companyId=${companyId}` : '/api/documents';
      const response = await authFetch(url);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [companyId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 50MB limit
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be under 50MB');
      return;
    }

    // Accepted types
    const accepted = ['application/pdf', 'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv', 'application/csv'];
    if (!accepted.includes(file.type) && !file.name.endsWith('.csv')) {
      toast.error('Only PDF, Excel, and CSV files are accepted');
      return;
    }

    setSelectedFile(file);
    setShowUpload(true);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('documentType', docType);
    if (companyId) formData.append('companyId', companyId);

    try {
      const token = localStorage.getItem('fg_token');
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await response.json();
      if (response.ok && data.ok) {
        toast.success('Document uploaded successfully');
        setSelectedFile(null);
        setShowUpload(false);
        setDocType('other');
        fetchDocuments();
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch {
      toast.error('Network error during upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

    try {
      const response = await authFetch(`/api/documents/${docId}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Document deleted');
        setDocuments(documents.filter((d) => d.id !== docId));
      } else {
        toast.error('Failed to delete document');
      }
    } catch {
      toast.error('Network error during deletion');
    }
  };

  const filteredDocs = documents.filter((d) => {
    const matchesSearch = d.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.documentType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.companyName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || d.documentType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FolderLock className="w-8 h-8 text-[#C9A64A]" />
                <h1 className="text-2xl font-bold text-[#1A1A1A]">Document Vault</h1>
              </div>
              <p className="text-gray-600">
                Securely store compliance documents with 7-year retention · AES-256 encrypted · GDPR compliant
              </p>
            </div>
            <Button
              onClick={() => fileRef.current?.click()}
              className="bg-[#C9A64A] hover:bg-[#B8954A] text-white gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Document
            </Button>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.xlsx,.xls,.csv"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Upload panel */}
        {showUpload && selectedFile && (
          <Card className="mb-6 border-[#C9A64A]/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#C9A64A]" />
                Upload: {selectedFile.name}
              </CardTitle>
              <CardDescription>
                {formatFileSize(selectedFile.size)} · {selectedFile.type || 'Unknown type'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="flex items-end gap-4">
                <div className="flex-1">
                  <Label className="text-sm">Document Type</Label>
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOC_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={uploading} className="bg-[#C9A64A] hover:bg-[#B8954A] text-white">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Upload
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowUpload(false); setSelectedFile(null); }}>
                  Cancel
                </Button>
              </form>
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                Document will be retained for 7 years in compliance with UK accounting regulations.
                Retention until: {new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <div className="text-2xl font-bold text-[#1A1A1A]">{documents.length}</div>
            <div className="text-xs text-gray-500 mt-1">Total Documents</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <div className="text-2xl font-bold text-[#1A1A1A]">
              {formatFileSize(documents.reduce((sum, d) => sum + (d.fileSize || 0), 0))}
            </div>
            <div className="text-xs text-gray-500 mt-1">Total Storage</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <div className="text-2xl font-bold text-green-600">7yr</div>
            <div className="text-xs text-gray-500 mt-1">Retention Policy</div>
          </div>
        </div>

        {/* Search & Filter */}
        <Card>
          <CardHeader>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {DOC_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-16 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#C9A64A] mx-auto" />
                <p className="text-gray-500 mt-3">Loading documents...</p>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="py-16 text-center">
                <FolderLock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  {documents.length === 0
                    ? 'No documents yet. Upload your first compliance document.'
                    : 'No documents match your search.'}
                </p>
                {documents.length === 0 && (
                  <Button
                    onClick={() => fileRef.current?.click()}
                    className="mt-4 bg-[#C9A64A] hover:bg-[#B8954A] text-white gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload First Document
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                    <span className="text-2xl">{getDocIcon(doc.mimeType)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-[#1A1A1A] truncate">{doc.originalName}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {doc.documentType && (
                          <Badge variant="secondary" className="text-xs">
                            {DOC_TYPES.find((t) => t.value === doc.documentType)?.label || doc.documentType}
                          </Badge>
                        )}
                        {doc.companyName && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {doc.companyName}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{formatFileSize(doc.fileSize)}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1 text-xs text-gray-400 justify-end">
                        <Calendar className="w-3 h-3" />
                        {formatDate(doc.createdAt)}
                      </div>
                      {doc.retentionUntil && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Retain until: {formatDate(doc.retentionUntil)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {doc.fileUrl && (
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                            <Download className="w-4 h-4" />
                          </Button>
                        </a>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(doc.id, doc.originalName)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
