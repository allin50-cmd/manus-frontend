import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Bell,
  FileText,
  File,
  CheckCircle2,
  AlertTriangle,
  Upload,
  FolderPlus,
  FileBarChart,
  UserPlus,
  HardDrive,
  Users,
  ClipboardList,
  LayoutDashboard,
  ChevronRight,
} from 'lucide-react';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
type TabId = 'overview' | 'documents' | 'compliance' | 'team' | 'audit';

interface DocRow {
  name: string;
  type: 'PDF' | 'DOCX' | 'ZIP' | 'XLSX' | 'CSV';
  classification: 'Confidential' | 'Internal' | 'Restricted';
  owner: string;
  modified: string;
}

// ──────────────────────────────────────────────
// Static data
// ──────────────────────────────────────────────
const DOCS: DocRow[] = [
  { name: 'Board_Minutes_Q1_2026.pdf',    type: 'PDF',  classification: 'Confidential', owner: 'Sarah Chen',  modified: '2h ago' },
  { name: 'Services_Agreement_v3.docx',   type: 'DOCX', classification: 'Internal',     owner: 'Legal Team',  modified: '5h ago' },
  { name: 'Exhibit_A_Smith_v_Jones.pdf',  type: 'PDF',  classification: 'Confidential', owner: 'Clerk',       modified: 'Yesterday' },
  { name: 'ISO27001_Evidence_Pack.zip',   type: 'ZIP',  classification: 'Internal',     owner: 'IT Dept',     modified: '2 days' },
  { name: 'FCA_Correspondence_Mar26.pdf', type: 'PDF',  classification: 'Confidential', owner: 'Compliance',  modified: '3 days' },
  { name: 'Payroll_March_2026.xlsx',      type: 'XLSX', classification: 'Restricted',   owner: 'HR',          modified: '1 week' },
  { name: 'NDA_Harrington_v2.pdf',        type: 'PDF',  classification: 'Confidential', owner: 'Legal',       modified: '1 week' },
  { name: 'Audit_Trail_Export.csv',       type: 'CSV',  classification: 'Internal',     owner: 'System',      modified: '2 weeks' },
];

const COMPLIANCE_ITEMS = [
  { label: 'ISO 27001',              status: 'compliant' as const },
  { label: 'GDPR',                   status: 'compliant' as const },
  { label: 'FCA Requirements',       status: 'compliant' as const },
  { label: 'SOC 2 Type II',          status: 'review'    as const },
  { label: 'Cyber Essentials Plus',  status: 'compliant' as const },
];

const STORAGE_SEGMENTS = [
  { label: 'Documents', size: '6.2 GB', pct: 50, color: 'bg-blue-500' },
  { label: 'Archived',  size: '3.8 GB', pct: 31, color: 'bg-slate-500' },
  { label: 'Bundles',   size: '1.9 GB', pct: 15, color: 'bg-violet-500' },
  { label: 'Other',     size: '0.5 GB', pct:  4, color: 'bg-gray-500' },
];

const ALERTS = [
  {
    level: 'warn'    as const,
    title: '3 documents approaching retention deadline',
    sub:   'Review by 1 Apr',
  },
  {
    level: 'error'   as const,
    title: 'Litigation hold active on REF-2026-001',
    sub:   '14 documents affected',
  },
  {
    level: 'success' as const,
    title: 'Annual ISO 27001 surveillance audit passed',
    sub:   '8 Mar 2026',
  },
];

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview',    label: 'Overview'    },
  { id: 'documents',   label: 'Documents'   },
  { id: 'compliance',  label: 'Compliance'  },
  { id: 'team',        label: 'Team Access' },
  { id: 'audit',       label: 'Audit Log'   },
];

// ──────────────────────────────────────────────
// Small helpers
// ──────────────────────────────────────────────
function classificationBadge(c: DocRow['classification']) {
  if (c === 'Confidential') return 'border-red-500/40 bg-red-500/15 text-red-300';
  if (c === 'Restricted')   return 'border-purple-500/40 bg-purple-500/15 text-purple-300';
  return 'border-amber-500/40 bg-amber-500/15 text-amber-300';
}

function FileIcon({ type }: { type: DocRow['type'] }) {
  if (type === 'PDF' || type === 'DOCX') return <FileText className="w-4 h-4 text-[#5A4BFF]" />;
  return <File className="w-4 h-4 text-slate-400" />;
}

function AlertDot({ level }: { level: 'warn' | 'error' | 'success' }) {
  if (level === 'warn')    return <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-yellow-400" />;
  if (level === 'error')   return <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />;
  return <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400" />;
}

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────
function StatCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Documents */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <FileText className="w-4 h-4" />
          Total Documents
        </div>
        <span className="text-3xl font-bold text-white">2,847</span>
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs text-emerald-300">
          ↑ 12% this month
        </span>
      </div>

      {/* Storage Used */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <HardDrive className="w-4 h-4" />
          Storage Used
        </div>
        <span className="text-3xl font-bold text-white">12.4 <span className="text-lg font-medium text-gray-400">GB</span></span>
        <div className="flex flex-col gap-1">
          <div className="h-1.5 w-full rounded-full bg-white/10">
            <div className="h-full w-[12%] rounded-full bg-[#5A4BFF]" />
          </div>
          <span className="text-xs text-gray-500">12.4 GB / 100 GB</span>
        </div>
      </div>

      {/* Compliance Score */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <ClipboardList className="w-4 h-4" />
          Compliance Score
        </div>
        <span className="text-3xl font-bold text-white">94<span className="text-lg font-medium text-gray-400">%</span></span>
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs text-emerald-300">
          ↑ 3pts vs last audit
        </span>
      </div>

      {/* Pending Reviews */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Users className="w-4 h-4" />
          Pending Reviews
        </div>
        <span className="text-3xl font-bold text-white">23</span>
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-red-500/15 border border-red-500/30 px-2.5 py-0.5 text-xs text-red-300">
          ↓ 5 this week
        </span>
      </div>
    </div>
  );
}

function RecentDocuments() {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-base">Recent Documents</h2>
        <button className="text-xs text-[#5A4BFF] hover:underline">View all</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 border-b border-white/10 text-left">
              <th className="pb-2 font-medium pr-4">File</th>
              <th className="pb-2 font-medium pr-4">Type</th>
              <th className="pb-2 font-medium pr-4">Classification</th>
              <th className="pb-2 font-medium pr-4">Owner</th>
              <th className="pb-2 font-medium">Modified</th>
            </tr>
          </thead>
          <tbody>
            {DOCS.map((doc, i) => (
              <tr
                key={i}
                className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
              >
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-2 text-gray-200">
                    <FileIcon type={doc.type} />
                    <span className="truncate max-w-[200px]">{doc.name}</span>
                  </div>
                </td>
                <td className="py-2.5 pr-4">
                  <span className="text-xs font-mono text-gray-400 bg-white/5 rounded px-1.5 py-0.5">
                    {doc.type}
                  </span>
                </td>
                <td className="py-2.5 pr-4">
                  <Badge className={`border text-xs ${classificationBadge(doc.classification)}`}>
                    {doc.classification}
                  </Badge>
                </td>
                <td className="py-2.5 pr-4 text-gray-400">{doc.owner}</td>
                <td className="py-2.5 text-gray-500 text-xs">{doc.modified}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ComplianceGauge() {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-5 flex flex-col gap-5">
      <h2 className="text-white font-semibold text-base">Compliance Score</h2>

      {/* Gauge ring */}
      <div className="flex flex-col items-center gap-1 py-2">
        <div className="relative flex items-center justify-center w-32 h-32">
          {/* Outer decorative ring */}
          <div className="absolute inset-0 rounded-full border-[10px] border-white/10" />
          {/* Filled arc — achieved via conic-gradient */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'conic-gradient(#5A4BFF 0% 94%, transparent 94% 100%)',
              mask: 'radial-gradient(circle, transparent 52%, black 52%)',
              WebkitMask: 'radial-gradient(circle, transparent 52%, black 52%)',
            }}
          />
          <span className="relative text-3xl font-bold text-white">94%</span>
        </div>
        <span className="text-xs text-gray-500">Overall Compliance</span>
      </div>

      {/* Checklist */}
      <ul className="flex flex-col gap-2">
        {COMPLIANCE_ITEMS.map((item) => (
          <li key={item.label} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {item.status === 'compliant' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span className="text-gray-300">{item.label}</span>
            </div>
            {item.status === 'compliant' ? (
              <Badge className="border border-emerald-500/30 bg-emerald-500/15 text-emerald-300 text-xs">
                Compliant
              </Badge>
            ) : (
              <Badge className="border border-amber-500/30 bg-amber-500/15 text-amber-300 text-xs">
                In review
              </Badge>
            )}
          </li>
        ))}
      </ul>

      {/* Next audit */}
      <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Next Audit</p>
          <p className="text-sm font-medium text-white">14 June 2026</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 mb-0.5">Countdown</p>
          <p className="text-sm font-semibold text-[#5A4BFF]">37 days</p>
        </div>
      </div>
    </div>
  );
}

function StorageBreakdown() {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-5 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-base">Storage Breakdown</h2>
        <span className="text-xs text-gray-500">12.4 GB / 100 GB</span>
      </div>

      {/* Stacked bar */}
      <div className="h-4 w-full rounded-full overflow-hidden flex">
        {STORAGE_SEGMENTS.map((seg) => (
          <div
            key={seg.label}
            className={`${seg.color} h-full`}
            style={{ width: `${seg.pct}%` }}
          />
        ))}
        {/* Remainder (free) */}
        <div className="flex-1 bg-white/5 h-full" />
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-y-2 gap-x-4">
        {STORAGE_SEGMENTS.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${seg.color} shrink-0`} />
            <span className="text-xs text-gray-400">
              {seg.label}
              <span className="text-gray-500 ml-1">
                {seg.size} ({seg.pct}%)
              </span>
            </span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-white/5 border border-white/20 shrink-0" />
          <span className="text-xs text-gray-400">
            Free
            <span className="text-gray-500 ml-1">87.6 GB</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function RecentAlerts() {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-5 flex flex-col gap-4">
      <h2 className="text-white font-semibold text-base">Recent Alerts</h2>
      <div className="flex flex-col gap-3">
        {ALERTS.map((alert, i) => (
          <div
            key={i}
            className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 flex items-start gap-3"
          >
            <AlertDot level={alert.level} />
            <div className="min-w-0">
              <p className="text-sm text-gray-200 font-medium leading-snug">{alert.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{alert.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickActions() {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-4">
        Quick Actions
      </h2>
      <div className="flex flex-wrap gap-3">
        <Button className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white gap-2">
          <Upload className="w-4 h-4" />
          Upload Document
        </Button>
        <Button variant="outline" className="border-white/15 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white gap-2">
          <FolderPlus className="w-4 h-4" />
          New Folder
        </Button>
        <Button variant="outline" className="border-white/15 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white gap-2">
          <FileBarChart className="w-4 h-4" />
          Generate Report
        </Button>
        <Button variant="outline" className="border-white/15 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white gap-2">
          <UserPlus className="w-4 h-4" />
          Invite User
        </Button>
      </div>
    </div>
  );
}

function ComingSoon({ tab }: { tab: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
      <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
        <LayoutDashboard className="w-7 h-7 text-gray-600" />
      </div>
      <h3 className="text-xl font-semibold text-white">{tab}</h3>
      <p className="text-gray-500 text-sm max-w-xs">
        This section is coming soon. We're building something great here.
      </p>
      <Badge className="border border-[#5A4BFF]/40 bg-[#5A4BFF]/15 text-[#8B7FFF] text-xs">
        Coming soon
      </Badge>
    </div>
  );
}

// ──────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────
export default function VaultDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  return (
    <div className="min-h-screen bg-[#0F1014] text-white">
      {/* ── Header ── */}
      <header className="border-b border-white/10 bg-[#0F1014]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo + breadcrumb */}
          <div className="flex items-center gap-3">
            <Link href="/vaultline" className="flex items-center gap-2 text-white font-semibold">
              <Shield className="w-6 h-6 text-[#5A4BFF]" />
              VaultLine Cloud
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-400">Dashboard</span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-4">
            {/* Notification bell */}
            <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
              <Bell className="w-5 h-5 text-gray-400" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-[#0F1014]" />
            </button>

            {/* Avatar */}
            <div className="h-8 w-8 rounded-full bg-[#5A4BFF] flex items-center justify-center text-xs font-bold select-none">
              AC
            </div>
          </div>
        </div>
      </header>

      {/* ── Navigation tabs ── */}
      <nav className="sticky top-0 z-10 border-b border-white/10 bg-[#0F1014]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5A4BFF] rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Main content ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'overview' ? (
          <div className="flex flex-col gap-6">
            {/* Row 1 — Stat cards */}
            <StatCards />

            {/* Row 2 — Documents table + compliance gauge */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RecentDocuments />
              </div>
              <div className="lg:col-span-1">
                <ComplianceGauge />
              </div>
            </div>

            {/* Row 3 — Storage + Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StorageBreakdown />
              <RecentAlerts />
            </div>

            {/* Quick actions */}
            <QuickActions />
          </div>
        ) : (
          <ComingSoon tab={TABS.find((t) => t.id === activeTab)?.label ?? ''} />
        )}
      </main>
    </div>
  );
}
