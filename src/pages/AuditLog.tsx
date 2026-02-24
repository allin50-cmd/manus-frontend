/**
 * Audit Log Page
 * Immutable audit trail with filtering, export, and VaultLine WORM status
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollText, Filter, Download, RefreshCw, Shield,
  AlertTriangle, AlertCircle, Info, CheckCircle2, XCircle,
  Lock, Database, Clock, User, Search, ChevronDown, Upload,
  FileText, Plus,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { cn, formatDateTime, timeAgo, formatNumber } from '@/lib/utils';
import { getBufferedEvents, flushQueue, getQueueSize, bufferEvent } from '@/services/auditBuffer';
import type { AuditEvent, AuditSeverity, AuditEventType } from '@/types/audit';

// ─── Mock event generator ─────────────────────────────────────────────────────

function generateMockEvents(count = 40): AuditEvent[] {
  const types: AuditEventType[] = [
    'auth.login', 'data.read', 'ai.query', 'compliance.check',
    'workflow.start', 'workflow.complete', 'document.upload',
    'approval.request', 'ai.tool_use', 'data.export', 'auth.failed',
  ];
  const users = [
    { id: 'u1', name: 'Alice Johnson' },
    { id: 'u2', name: 'Bob Smith' },
    { id: 'u3', name: 'System' },
    { id: 'u4', name: 'FineGuard Bot' },
  ];
  const severities: AuditSeverity[] = ['info', 'info', 'info', 'low', 'medium', 'high'];
  const actions = [
    'User authenticated via MSAL PKCE',
    'Client record accessed: ACME Ltd',
    'AI risk assessment completed',
    'Companies House compliance check run',
    'Workflow "Compliance Check" started',
    'Workflow "Compliance Check" completed — 42 clients',
    'Document uploaded: lease-agreement.pdf',
    'Approval request created: APR-001',
    'Tool "check_compliance_status" executed',
    'Data export: compliance_report_2024.csv',
    'Failed authentication attempt from 192.168.1.100',
  ];

  return Array.from({ length: count }, (_, i) => {
    const user = users[i % users.length];
    const type = types[i % types.length];
    const sev = severities[i % severities.length];
    return {
      id: `evt-${i.toString().padStart(4, '0')}`,
      type,
      severity: sev,
      userId: user.id,
      userName: user.name,
      tenantId: 'tenant-001',
      action: actions[i % actions.length],
      status: i === 10 ? 'failure' : 'success',
      ipAddress: `192.168.1.${(i % 50) + 1}`,
      timestamp: new Date(Date.now() - i * 1000 * 60 * 3).toISOString(),
      vaultRef: i < 30 ? `VL-${(10000 + i).toString()}` : undefined,
    };
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function severityConfig(sev: AuditSeverity) {
  return {
    info:     { label: 'Info',     color: 'text-blue-400',   bg: 'bg-blue-500/10',   icon: Info },
    low:      { label: 'Low',      color: 'text-green-400',  bg: 'bg-green-500/10',  icon: CheckCircle2 },
    medium:   { label: 'Medium',   color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: AlertTriangle },
    high:     { label: 'High',     color: 'text-orange-400', bg: 'bg-orange-500/10', icon: AlertCircle },
    critical: { label: 'Critical', color: 'text-red-400',    bg: 'bg-red-500/10',    icon: AlertCircle },
  }[sev];
}

// ─── Event Row ────────────────────────────────────────────────────────────────

function EventRow({ event }: { event: AuditEvent }) {
  const [expanded, setExpanded] = useState(false);
  const sev = severityConfig(event.severity);
  const SevIcon = sev.icon;

  return (
    <div className="border-b border-white/5 last:border-0">
      <div
        className="flex items-center gap-3 px-4 py-3 hover:bg-white/3 cursor-pointer transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className={`p-1.5 rounded-lg ${sev.bg} shrink-0`}>
          <SevIcon className={`w-3 h-3 ${sev.color}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-[10px] text-gray-500 font-mono">{event.type}</code>
            {event.vaultRef && (
              <span className="text-[10px] text-purple-400 flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5" /> {event.vaultRef}
              </span>
            )}
          </div>
          <p className="text-xs text-white mt-0.5 truncate">{event.action}</p>
        </div>

        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-gray-600">{event.userName}</span>
          <span className={cn('text-[10px] font-medium', event.status === 'success' ? 'text-green-400' : 'text-red-400')}>
            {event.status}
          </span>
        </div>

        <div className="text-right shrink-0">
          <p className="text-[10px] text-gray-500">{timeAgo(event.timestamp)}</p>
          {event.ipAddress && <p className="text-[10px] text-gray-700 font-mono">{event.ipAddress}</p>}
        </div>

        <ChevronDown className={cn('w-3.5 h-3.5 text-gray-600 shrink-0 transition-transform', expanded && 'rotate-180')} />
      </div>

      {expanded && (
        <div className="px-4 pb-3 animate-fade-in">
          <div className="bg-white/3 rounded-xl p-3 border border-white/5 grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-gray-600">Event ID</p>
              <p className="text-white font-mono">{event.id}</p>
            </div>
            <div>
              <p className="text-gray-600">User ID</p>
              <p className="text-white font-mono">{event.userId}</p>
            </div>
            <div>
              <p className="text-gray-600">Tenant</p>
              <p className="text-white">{event.tenantId}</p>
            </div>
            <div>
              <p className="text-gray-600">Timestamp</p>
              <p className="text-white">{formatDateTime(event.timestamp)}</p>
            </div>
            {event.vaultRef && (
              <div className="col-span-2">
                <p className="text-gray-600">VaultLine WORM Reference</p>
                <p className="text-purple-400 font-mono">{event.vaultRef} — Immutable ✓</p>
              </div>
            )}
            {event.metadata && (
              <div className="col-span-2">
                <p className="text-gray-600 mb-1">Metadata</p>
                <pre className="text-[10px] text-gray-400 overflow-x-auto">{JSON.stringify(event.metadata, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AuditLog() {
  const [events, setEvents] = useState<AuditEvent[]>(generateMockEvents());
  const [buffered, setBuffered] = useState(getQueueSize());
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [flushing, setFlushing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setBuffered(getQueueSize()), 3000);
    return () => clearInterval(interval);
  }, []);

  const handleFlush = useCallback(async () => {
    setFlushing(true);
    try {
      await flushQueue();
      setBuffered(0);
    } finally {
      setFlushing(false);
    }
  }, []);

  const handleAddTestEvent = async () => {
    await bufferEvent('ai.query', 'Test audit event from UI', { severity: 'info' });
    setBuffered(getQueueSize());
  };

  const filtered = events.filter((e) => {
    const matchSearch = !search || e.action.toLowerCase().includes(search.toLowerCase()) || e.type.includes(search.toLowerCase()) || e.userName.toLowerCase().includes(search.toLowerCase());
    const matchSev = filterSeverity === 'all' || e.severity === filterSeverity;
    const matchStatus = filterStatus === 'all' || e.status === filterStatus;
    return matchSearch && matchSev && matchStatus;
  });

  const immutableCount = events.filter((e) => e.vaultRef).length;
  const criticalCount = events.filter((e) => e.severity === 'high' || e.severity === 'critical').length;
  const failureCount = events.filter((e) => e.status === 'failure').length;

  return (
    <DashboardLayout
      title="Audit Log"
      subtitle="Immutable event trail — VaultLine WORM protected"
      actions={
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleAddTestEvent}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Test Event
          </Button>
          <Button variant="secondary" size="sm" onClick={handleFlush} loading={flushing}>
            <Upload className="w-3.5 h-3.5 mr-1.5" /> Flush ({buffered})
          </Button>
        </div>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Events', value: formatNumber(events.length), icon: ScrollText, color: 'text-cyan-400' },
          { label: 'WORM Written', value: formatNumber(immutableCount), icon: Lock, color: 'text-purple-400' },
          { label: 'High Severity', value: criticalCount, icon: AlertTriangle, color: 'text-orange-400' },
          { label: 'Failures', value: failureCount, icon: XCircle, color: 'text-red-400' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="pt-4 flex items-center gap-3">
                <Icon className={`w-5 h-5 ${s.color}`} />
                <div>
                  <p className="text-lg font-bold text-white tabular-nums">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Buffer status */}
      {buffered > 0 && (
        <div className="mb-4 flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <Database className="w-4 h-4 text-yellow-400 shrink-0" />
          <p className="text-sm text-yellow-300 flex-1">
            <span className="font-semibold">{buffered} events</span> buffered locally — not yet written to VaultLine WORM storage
          </p>
          <Button variant="secondary" size="sm" onClick={handleFlush} loading={flushing}>
            Flush Now
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Input
          leftIcon={<Search className="w-3.5 h-3.5" />}
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-xs"
        />
        <div className="flex gap-2">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
          >
            <option value="all" className="bg-[#1a1d2e]">All Severity</option>
            {['info', 'low', 'medium', 'high', 'critical'].map((s) => (
              <option key={s} value={s} className="bg-[#1a1d2e] capitalize">{s}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
          >
            <option value="all" className="bg-[#1a1d2e]">All Status</option>
            <option value="success" className="bg-[#1a1d2e]">Success</option>
            <option value="failure" className="bg-[#1a1d2e]">Failure</option>
          </select>
        </div>
        <Button variant="ghost" size="sm" className="ml-auto" onClick={() => { /* export */ }}>
          <Download className="w-3.5 h-3.5 mr-1.5" /> Export
        </Button>
      </div>

      {/* Events table */}
      <Card>
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
          <p className="text-xs text-gray-500">{filtered.length} events</p>
          <button onClick={() => setEvents(generateMockEvents())} className="text-xs text-gray-600 hover:text-gray-400 flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
        <div className="divide-y divide-white/5">
          {filtered.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <ScrollText className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No events match your filter</p>
            </div>
          )}
        </div>
      </Card>
    </DashboardLayout>
  );
}

