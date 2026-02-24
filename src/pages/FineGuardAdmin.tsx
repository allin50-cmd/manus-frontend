/**
 * FineGuard MTD Admin Page
 * Central hub for managing imports, connectors, and MTD submissions.
 * Route: /admin/mtd
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Upload, RefreshCw, Shield, FileText, Activity,
  ChevronDown, ChevronUp, AlertCircle, CheckCircle,
  BarChart3, Clock, Send,
} from 'lucide-react';
import {
  listImports, listConnectors, getConnectorStatus, approveImport,
  createConnector, refreshConnector, listAuditEvents,
  type Import, type McpConnector, type AuditEvent, type ConnectorStatus,
} from '@/services/mtdApi';
import ImportTable from '@/components/fineguard/ImportTable';
import ConnectorCard from '@/components/fineguard/ConnectorCard';
import SubmissionPanel from '@/components/fineguard/SubmissionPanel';

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'imports' | 'connectors' | 'submit' | 'audit';

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'imports',    label: 'Imports',    icon: Upload },
  { id: 'connectors', label: 'Connectors', icon: Shield },
  { id: 'submit',     label: 'Submit MTD', icon: Send },
  { id: 'audit',      label: 'Audit Log',  icon: Activity },
];

// ─── Demo Tenant ─────────────────────────────────────────────────────────────

const TENANT_ID = 'demo-tenant';

// ─── Upload Modal ─────────────────────────────────────────────────────────────

function UploadModal({ onClose, onUploaded }: { onClose: () => void; onUploaded: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isPdf = file?.name.endsWith('.pdf');

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const endpoint = isPdf ? '/api/import/pdf' : '/api/import/csv';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'x-tenant-id': TENANT_ID },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(`Import ${data.importId} created with ${data.validRows ?? data.recordCount ?? 0} records.`);
      onUploaded();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Import File</h2>

        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mb-4 cursor-pointer hover:border-[#C9A64A] transition-colors"
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600">{file ? file.name : 'Click to select CSV or PDF file'}</p>
          <p className="text-xs text-gray-400 mt-1">Max 50 MB</p>
          <input
            id="fileInput"
            type="file"
            accept=".csv,.pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 mb-4">
            <CheckCircle className="w-4 h-4 inline mr-1" /> {result}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-4">
            <AlertCircle className="w-4 h-4 inline mr-1" /> {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex-1 bg-[#C9A64A] hover:bg-[#B8954A] text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FineGuardAdmin() {
  const [tab, setTab] = useState<Tab>('imports');
  const [imports, setImports] = useState<Import[]>([]);
  const [connectors, setConnectors] = useState<McpConnector[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [status, setStatus] = useState<ConnectorStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedImportId, setSelectedImportId] = useState<string | undefined>();
  const [refreshingConnector, setRefreshingConnector] = useState<string | null>(null);
  const [addProvider, setAddProvider] = useState('');

  const loadImports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listImports(TENANT_ID);
      setImports(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadConnectors = useCallback(async () => {
    try {
      const [conns, stat] = await Promise.all([
        listConnectors(TENANT_ID),
        getConnectorStatus(TENANT_ID).catch(() => null),
      ]);
      setConnectors(conns);
      if (stat) setStatus(stat);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadAudit = useCallback(async () => {
    try {
      const events = await listAuditEvents(TENANT_ID);
      setAuditEvents(events);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (tab === 'imports') loadImports();
    if (tab === 'connectors') loadConnectors();
    if (tab === 'audit') loadAudit();
  }, [tab, loadImports, loadConnectors, loadAudit]);

  const handleApprove = async (importId: string) => {
    await approveImport(importId, 'admin', TENANT_ID);
    await loadImports();
  };

  const handleRefreshConnector = async (id: string) => {
    setRefreshingConnector(id);
    try {
      await refreshConnector(id, TENANT_ID);
      await loadConnectors();
    } finally {
      setRefreshingConnector(null);
    }
  };

  const handleAddConnector = async () => {
    if (!addProvider) return;
    const { authUrl } = await createConnector(addProvider, TENANT_ID);
    window.open(authUrl, '_blank', 'width=600,height=700');
    setAddProvider('');
    setTimeout(loadConnectors, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-[#C9A64A]" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">FineGuard MTD</h1>
              <p className="text-xs text-gray-500">Making Tax Digital Submission Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {status && (
              <div className="hidden md:flex items-center gap-4 text-xs text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5">
                <span className="flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" />
                  {status.importSummary.total} imports
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  {status.importSummary.approved} approved
                </span>
                <span className="flex items-center gap-1">
                  <Send className="w-3 h-3 text-purple-500" />
                  {status.importSummary.submitted} submitted
                </span>
              </div>
            )}
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 bg-[#C9A64A] hover:bg-[#B8954A] text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="max-w-7xl mx-auto flex gap-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === id
                  ? 'border-[#C9A64A] text-[#C9A64A]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* IMPORTS TAB */}
        {tab === 'imports' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">All Imports</h2>
              <button onClick={loadImports} className="text-gray-500 hover:text-gray-700">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <ImportTable
              imports={imports}
              onViewRecords={(id) => { setSelectedImportId(id); setTab('submit'); }}
              onApprove={handleApprove}
              loading={loading}
            />
          </div>
        )}

        {/* CONNECTORS TAB */}
        {tab === 'connectors' && (
          <div className="space-y-6">
            {/* Add connector */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Connect Accounting System</h2>
              <div className="flex gap-3">
                <select
                  value={addProvider}
                  onChange={(e) => setAddProvider(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A64A]"
                >
                  <option value="">Select provider…</option>
                  <option value="xero">Xero</option>
                  <option value="quickbooks">QuickBooks</option>
                  <option value="sage">Sage Business Cloud</option>
                  <option value="dynamics365">Dynamics 365</option>
                </select>
                <button
                  onClick={handleAddConnector}
                  disabled={!addProvider}
                  className="bg-[#C9A64A] hover:bg-[#B8954A] text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  Connect
                </button>
              </div>
            </div>

            {/* Connector cards */}
            {connectors.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                No connectors configured. Add one above.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {connectors.map((c) => (
                  <ConnectorCard
                    key={c.id}
                    connector={c}
                    onRefresh={handleRefreshConnector}
                    refreshing={refreshingConnector === c.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUBMIT TAB */}
        {tab === 'submit' && (
          <div className="max-w-lg">
            {selectedImportId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 text-sm text-blue-700 mb-4 flex items-center justify-between">
                <span>
                  Submitting from import <span className="font-mono text-xs">{selectedImportId}</span>
                </span>
                <button
                  onClick={() => setSelectedImportId(undefined)}
                  className="text-blue-500 hover:text-blue-700 text-xs"
                >
                  Clear
                </button>
              </div>
            )}
            <SubmissionPanel
              tenantId={TENANT_ID}
              importId={selectedImportId}
              onSuccess={() => loadImports()}
            />
          </div>
        )}

        {/* AUDIT TAB */}
        {tab === 'audit' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Audit Log (WORM)</h2>
              <button onClick={loadAudit} className="text-gray-500 hover:text-gray-700">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            {auditEvents.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                No audit events yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {auditEvents.map((ev) => (
                  <AuditRow key={ev.id} event={ev} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={() => { loadImports(); setShowUpload(false); }}
        />
      )}
    </div>
  );
}

// ─── Audit Row ────────────────────────────────────────────────────────────────

function AuditRow({ event }: { event: AuditEvent }) {
  const [expanded, setExpanded] = useState(false);
  const severityColor: Record<string, string> = {
    info: 'text-blue-600',
    warn: 'text-amber-600',
    error: 'text-red-600',
    critical: 'text-red-800',
  };

  return (
    <div className="px-5 py-3 hover:bg-gray-50">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className={`text-xs font-mono font-medium ${severityColor[event.severity] ?? 'text-gray-600'}`}>
            {event.severity.toUpperCase()}
          </span>
          <span className="text-sm text-gray-900">{event.eventType}</span>
          {event.resourceType && (
            <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
              {event.resourceType}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>{new Date(event.createdAt).toLocaleString('en-GB')}</span>
          {event.blobUrl && (
            <span className="text-green-600 font-medium">WORM ✓</span>
          )}
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </div>
      </div>

      {expanded && (
        <div className="mt-2 pl-0">
          <pre className="text-xs bg-gray-50 border border-gray-200 rounded p-3 overflow-x-auto text-gray-700">
            {JSON.stringify(event.payloadSummary, null, 2)}
          </pre>
          {event.blobUrl && (
            <p className="text-xs text-gray-500 mt-1">
              Blob: <span className="font-mono">{event.blobUrl}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
