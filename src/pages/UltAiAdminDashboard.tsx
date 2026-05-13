import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import {
  Search, Download, RefreshCw, Cpu, ExternalLink,
  ChevronDown, Circle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UltaiIntake {
  id: string;
  intakeId: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string | null;
  industry: string | null;
  companySize: string | null;
  website: string | null;
  businessDescription: string | null;
  targetMarket: string | null;
  currentRevenue: string | null;
  challenges: string | null;
  aiExperience: string | null;
  techStack: string | null;
  currentTools: string | null;
  cloudPlatform: string | null;
  primaryGoals: string | null;
  timeline: string | null;
  budget: string | null;
  additionalNotes: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'closed';
  createdAt: string;
  updatedAt: string;
}

type StatusFilter = 'all' | 'new' | 'contacted' | 'qualified' | 'closed';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  new:       { label: 'New',       dot: 'bg-cyan-400',   bg: 'bg-cyan-400/10',   text: 'text-cyan-300' },
  contacted: { label: 'Contacted', dot: 'bg-blue-400',   bg: 'bg-blue-400/10',   text: 'text-blue-300' },
  qualified: { label: 'Qualified', dot: 'bg-emerald-400',bg: 'bg-emerald-400/10',text: 'text-emerald-300' },
  closed:    { label: 'Closed',    dot: 'bg-slate-500',  bg: 'bg-slate-500/10',  text: 'text-slate-400' },
};

const ALL_STATUSES: StatusFilter[] = ['all', 'new', 'contacted', 'qualified', 'closed'];

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.new;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

// ─── Detail drawer ────────────────────────────────────────────────────────────

function DetailDrawer({ intake, onClose, onStatusChange }: {
  intake: UltaiIntake;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => Promise<void>;
}) {
  const [updating, setUpdating] = useState(false);

  const change = async (s: string) => {
    setUpdating(true);
    await onStatusChange(intake.id, s);
    setUpdating(false);
  };

  const Row = ({ label, value }: { label: string; value: string | null | undefined }) =>
    value ? (
      <div>
        <p className="text-[10px] font-semibold tracking-widest text-slate-500 uppercase mb-0.5">{label}</p>
        <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{value}</p>
      </div>
    ) : null;

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/50 backdrop-blur-sm" />
      <div
        className="w-full max-w-lg h-full bg-[#0d0e14] border-l border-slate-800/60 overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-[#0d0e14]/95 backdrop-blur border-b border-slate-800/60 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-mono">{intake.intakeId}</p>
            <h3 className="text-lg font-semibold text-white leading-tight">{intake.companyName}</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition text-xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-6 flex flex-col gap-6">
          {/* Status control */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-slate-500 uppercase mb-2">Status</p>
            <div className="flex flex-wrap gap-2">
              {(['new','contacted','qualified','closed'] as const).map(s => (
                <button
                  key={s}
                  disabled={updating || intake.status === s}
                  onClick={() => change(s)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition
                    ${intake.status === s
                      ? `${STATUS_META[s].bg} ${STATUS_META[s].text} border-transparent`
                      : 'border-slate-700/50 text-slate-500 hover:border-slate-600 hover:text-slate-300 disabled:opacity-40'}`}
                >
                  {STATUS_META[s].label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-slate-800/60" />

          {/* Contact */}
          <section>
            <h4 className="text-xs font-semibold tracking-widest text-slate-500 uppercase mb-3">Contact</h4>
            <div className="grid grid-cols-1 gap-3">
              <Row label="Contact Name" value={intake.contactName} />
              <Row label="Email" value={intake.email} />
              <Row label="Phone" value={intake.phone} />
              <Row label="Website" value={intake.website} />
            </div>
          </section>

          <div className="h-px bg-slate-800/60" />

          {/* Company */}
          <section>
            <h4 className="text-xs font-semibold tracking-widest text-slate-500 uppercase mb-3">Company</h4>
            <div className="grid grid-cols-2 gap-3">
              <Row label="Industry" value={intake.industry} />
              <Row label="Size" value={intake.companySize} />
              <Row label="Revenue" value={intake.currentRevenue} />
              <Row label="Target Market" value={intake.targetMarket} />
            </div>
            <div className="mt-3">
              <Row label="Business Description" value={intake.businessDescription} />
            </div>
          </section>

          <div className="h-px bg-slate-800/60" />

          {/* Challenges */}
          <section>
            <h4 className="text-xs font-semibold tracking-widest text-slate-500 uppercase mb-3">Challenges & AI</h4>
            <div className="flex flex-col gap-3">
              <Row label="AI Experience" value={intake.aiExperience} />
              <Row label="Primary Challenges" value={intake.challenges} />
            </div>
          </section>

          <div className="h-px bg-slate-800/60" />

          {/* Tech */}
          <section>
            <h4 className="text-xs font-semibold tracking-widest text-slate-500 uppercase mb-3">Technology</h4>
            <div className="flex flex-col gap-3">
              <Row label="Cloud Platform" value={intake.cloudPlatform} />
              <Row label="Tech Stack" value={intake.techStack} />
              <Row label="Current Tools" value={intake.currentTools} />
            </div>
          </section>

          <div className="h-px bg-slate-800/60" />

          {/* Goals */}
          <section>
            <h4 className="text-xs font-semibold tracking-widest text-slate-500 uppercase mb-3">Goals & Timeline</h4>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Row label="Timeline" value={intake.timeline} />
              <Row label="Budget" value={intake.budget} />
            </div>
            <Row label="Primary Goals" value={intake.primaryGoals} />
            <div className="mt-3">
              <Row label="Additional Notes" value={intake.additionalNotes} />
            </div>
          </section>

          <div className="h-px bg-slate-800/60" />

          <p className="text-xs text-slate-600">
            Submitted {new Date(intake.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export default function UltAiAdminDashboard() {
  const [, setLocation] = useLocation();
  const [intakes, setIntakes] = useState<UltaiIntake[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selected, setSelected] = useState<UltaiIntake | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/admin/ultai-intakes?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setIntakes(json.intakes);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to load intakes');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/ultai-intakes/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setIntakes(prev => prev.map(r => r.id === id ? { ...r, status: json.intake.status } : r));
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: json.intake.status } : prev);
      toast.success('Status updated');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to update status');
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/admin/ultai-intakes/export');
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ultai-intakes-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const counts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = s === 'all' ? intakes.length : intakes.filter(r => r.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-[#0B0C10] text-white">
      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(6,182,212,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(6,182,212,0.025) 1px,transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Header */}
      <header className="relative border-b border-slate-800/60 bg-[#0B0C10]/80 backdrop-blur-xl z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white tracking-tight">UltAi</span>
            <span className="text-slate-600 text-sm">/ Admin</span>
            <span className="ml-2 text-[10px] font-semibold tracking-widest text-cyan-500 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded uppercase">
              Intake Queue
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation('/ultai-intake')}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" /> View Form
            </button>
            <button
              onClick={() => setLocation('/')}
              className="text-xs text-slate-500 hover:text-slate-300 transition tracking-wide"
            >
              ← Home
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-6 py-10">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {(['new','contacted','qualified','closed'] as const).map(s => {
            const m = STATUS_META[s];
            const cnt = intakes.filter(r => r.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
                className={`rounded-xl border p-4 text-left transition cursor-pointer group
                  ${statusFilter === s
                    ? `${m.bg} border-current ${m.text}`
                    : 'bg-slate-900/40 border-slate-800/40 hover:border-slate-700/60'}`}
              >
                <p className={`text-2xl font-bold mb-0.5 ${statusFilter === s ? m.text : 'text-white'}`}>{cnt}</p>
                <p className={`text-xs font-semibold ${statusFilter === s ? m.text : 'text-slate-500'}`}>{m.label}</p>
              </button>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-700/60 bg-slate-900/60 text-sm text-white placeholder:text-slate-600 focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/40 outline-none transition"
              placeholder="Search company, contact, email, or ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="relative">
            <select
              className="appearance-none pl-3 pr-8 py-2.5 rounded-lg border border-slate-700/60 bg-slate-900/60 text-sm text-white focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/40 outline-none transition cursor-pointer"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as StatusFilter)}
            >
              {ALL_STATUSES.map(s => (
                <option key={s} value={s}>
                  {s === 'all' ? `All (${intakes.length})` : `${STATUS_META[s].label} (${counts[s] ?? 0})`}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          </div>

          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-700/60 text-sm text-slate-400 hover:text-white hover:border-slate-600 disabled:opacity-50 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={exportCsv}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-sm text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-50 transition"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-slate-800/50 bg-slate-950/50 backdrop-blur overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800/60">
                  {['ID','Company','Contact','Email','Industry','Status','Submitted'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest text-slate-500 uppercase whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-slate-600 text-sm">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 opacity-50" />
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && intakes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-slate-600 text-sm">
                      <Circle className="w-8 h-8 mx-auto mb-3 opacity-20" />
                      No intake submissions found
                    </td>
                  </tr>
                )}
                {!loading && intakes.map(intake => (
                  <tr
                    key={intake.id}
                    onClick={() => setSelected(intake)}
                    className="border-b border-slate-800/40 hover:bg-slate-800/20 cursor-pointer transition group"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-cyan-500/80 whitespace-nowrap">
                      {intake.intakeId}
                    </td>
                    <td className="px-4 py-3 font-medium text-white whitespace-nowrap">
                      {intake.companyName}
                    </td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                      {intake.contactName}
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {intake.email}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {intake.industry || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={intake.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">
                      {new Date(intake.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-700">
          {intakes.length} submission{intakes.length !== 1 ? 's' : ''} shown
        </p>
      </main>

      {selected && (
        <DetailDrawer
          intake={selected}
          onClose={() => setSelected(null)}
          onStatusChange={updateStatus}
        />
      )}
    </div>
  );
}
