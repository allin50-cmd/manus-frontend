import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Building2,
  ChevronDown,
  RefreshCw,
  Ruler,
  Trash2,
  TrendingUp,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PieLead {
  id: string;
  ref: string;
  address: string;
  description: string;
  source: string;
  dateScraped: string;
  inferredBuildType: string;
  inferredFloorAreaM2: string;
  estimateConfidence: string;
  rateSource: string;
  rateValidationStatus: string;
  floorAreaSource: string;
  floorAreaConfidence: string;
  opportunityScore: number;
  estimatedBuildValue: string;
  crmStage: string;
  lastUpdated: string;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CRM_STAGES = ['New', 'Contacted', 'Site Visit', 'Quoted', 'Won', 'Lost'] as const;
type CrmStage = (typeof CRM_STAGES)[number];

const STAGE_COLOURS: Record<CrmStage, { border: string; header: string; dot: string }> = {
  New:          { border: 'border-blue-500/30',    header: 'text-blue-400',   dot: 'bg-blue-400' },
  Contacted:    { border: 'border-purple-500/30',  header: 'text-purple-400', dot: 'bg-purple-400' },
  'Site Visit': { border: 'border-yellow-500/30',  header: 'text-yellow-400', dot: 'bg-yellow-400' },
  Quoted:       { border: 'border-orange-500/30',  header: 'text-orange-400', dot: 'bg-orange-400' },
  Won:          { border: 'border-emerald-500/30', header: 'text-emerald-400',dot: 'bg-emerald-400' },
  Lost:         { border: 'border-red-500/30',     header: 'text-red-400',    dot: 'bg-red-400' },
};

const BUILD_TYPE_LABELS: Record<string, string> = {
  extension:       'Extension',
  new_build:       'New Build',
  loft_conversion: 'Loft Conversion',
  refurbishment:   'Refurb',
  other:           'Other',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(n)) return '—';
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n);
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + '…' : s;
}

// ─── Lead Card ────────────────────────────────────────────────────────────────

interface LeadCardProps {
  lead: PieLead;
  onMove: (ref: string, stage: CrmStage) => Promise<void>;
  onDelete: (ref: string) => Promise<void>;
}

function LeadCard({ lead, onMove, onDelete }: LeadCardProps) {
  const [moving, setMoving] = useState(false);

  async function handleMove(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStage = e.target.value as CrmStage;
    if (newStage === lead.crmStage) return;
    setMoving(true);
    await onMove(lead.ref, newStage);
    setMoving(false);
  }

  return (
    <div className="bg-[#0D1028] border border-white/10 rounded-lg p-3 space-y-2 hover:border-white/20 transition-colors">
      {/* Address */}
      <p className="font-semibold text-white text-sm leading-snug">{lead.address}</p>

      {/* Description */}
      {lead.description && (
        <p className="text-xs text-white/50 leading-relaxed">
          {truncate(lead.description, 80)}
        </p>
      )}

      {/* Build type + floor area */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-white/5 text-white/70 border border-white/10">
          <Building2 size={10} />
          {BUILD_TYPE_LABELS[lead.inferredBuildType] ?? lead.inferredBuildType}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-white/5 text-white/70 border border-white/10">
          <Ruler size={10} />
          {parseFloat(lead.inferredFloorAreaM2).toFixed(0)} m²
        </span>
      </div>

      {/* Opportunity score */}
      <div className="flex items-center gap-1.5">
        <TrendingUp size={12} className="text-indigo-400" />
        <span className="text-xs text-white/60">Score</span>
        <span className="text-xs font-bold text-indigo-300 ml-auto">{lead.opportunityScore}/100</span>
      </div>

      {/* Estimated value */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1.5 space-y-0.5">
        <div className="flex items-center gap-1">
          <AlertTriangle size={10} className="text-amber-400 flex-shrink-0" />
          <span className="text-xs text-amber-300 font-semibold">PLACEHOLDER</span>
        </div>
        <p className="text-sm font-bold text-amber-200">{fmt(lead.estimatedBuildValue)}</p>
        <p className="text-[10px] text-amber-400/70 leading-tight">
          Indicative only — requires professional validation
        </p>
      </div>

      {/* Stage move */}
      <div className="flex items-center gap-2 pt-1">
        <div className="relative flex-1">
          <select
            value={lead.crmStage}
            onChange={handleMove}
            disabled={moving}
            className="w-full appearance-none bg-white/5 border border-white/10 text-white/80 text-xs rounded px-2 py-1.5 pr-6 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-50 cursor-pointer"
          >
            {CRM_STAGES.map((s) => (
              <option key={s} value={s} className="bg-[#0D1028]">{s}</option>
            ))}
          </select>
          <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
        </div>
        <button
          onClick={() => onDelete(lead.ref)}
          className="p-1.5 rounded border border-red-500/20 text-red-400/60 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 transition-colors"
          title="Delete lead"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

// ─── Kanban Column ────────────────────────────────────────────────────────────

interface ColumnProps {
  stage: CrmStage;
  leads: PieLead[];
  onMove: (ref: string, stage: CrmStage) => Promise<void>;
  onDelete: (ref: string) => Promise<void>;
}

function KanbanColumn({ stage, leads, onMove, onDelete }: ColumnProps) {
  const colours = STAGE_COLOURS[stage];
  return (
    <div className={`flex flex-col min-w-[220px] flex-1 bg-[#070918] border rounded-xl ${colours.border}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/5">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colours.dot}`} />
        <span className={`text-sm font-semibold ${colours.header}`}>{stage}</span>
        <span className="ml-auto text-xs text-white/30 font-mono">{leads.length}</span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 p-2 overflow-y-auto max-h-[calc(100vh-220px)]">
        {leads.length === 0 ? (
          <p className="text-xs text-white/20 text-center py-4">No leads</p>
        ) : (
          leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onMove={onMove} onDelete={onDelete} />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function PieDashboard() {
  const [leads, setLeads] = useState<PieLead[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchLeads() {
    setLoading(true);
    try {
      const res = await fetch('/api/pie/leads');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLeads(data);
    } catch (err) {
      console.error('[PIE] fetch error:', err);
      toast.error('Failed to load PIE leads');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLeads(); }, []);

  async function handleMove(ref: string, stage: CrmStage) {
    try {
      const res = await fetch(`/api/pie/leads/${encodeURIComponent(ref)}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      const updated: PieLead = await res.json();
      setLeads((prev) => prev.map((l) => (l.ref === ref ? updated : l)));
      toast.success(`Moved to ${stage}`);
    } catch (err) {
      console.error('[PIE] move error:', err);
      toast.error(`Failed to move lead: ${(err as Error).message}`);
    }
  }

  async function handleDelete(ref: string) {
    if (!confirm('Delete this lead? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/pie/leads/${encodeURIComponent(ref)}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      setLeads((prev) => prev.filter((l) => l.ref !== ref));
      toast.success('Lead deleted');
    } catch (err) {
      console.error('[PIE] delete error:', err);
      toast.error(`Failed to delete lead: ${(err as Error).message}`);
    }
  }

  const byStage = (stage: CrmStage) => leads.filter((l) => l.crmStage === stage);

  return (
    <div className="min-h-screen bg-[#07091A] text-white">
      {/* Page header */}
      <div className="border-b border-white/5 bg-[#07091A]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <div>
            <h1 className="text-lg font-bold text-white">PIE Pipeline</h1>
            <p className="text-xs text-white/40">Property Intelligence Engine — construction lead Kanban</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-white/30">{leads.length} leads</span>
            <button
              onClick={fetchLeads}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/20 text-xs transition-colors disabled:opacity-40"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Placeholder rate warning */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
          <AlertTriangle size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-300/80">
            <span className="font-semibold text-amber-300">Placeholder rates — not validated.</span>{' '}
            All estimated build values use indicative £/m² rates and must be reviewed by a qualified QS before use.
          </p>
        </div>
      </div>

      {/* Kanban board */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pb-8">
        {loading && leads.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw size={24} className="animate-spin text-white/30" />
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-4">
            {CRM_STAGES.map((stage) => (
              <KanbanColumn
                key={stage}
                stage={stage}
                leads={byStage(stage)}
                onMove={handleMove}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
