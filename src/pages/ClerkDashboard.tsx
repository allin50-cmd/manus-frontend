import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  FileText,
  Calendar,
  DollarSign,
  RefreshCw,
  Plus,
  X,
  ChevronLeft,
  TrendingUp,
  Inbox,
} from 'lucide-react';
import { toast } from 'sonner';
import SEO from '@/components/SEO';
import PageSkeleton from '@/components/PageSkeleton';

const GOLD = '#C9A64A';
const BG = '#0F1014';
const CARD_BG = '#13151C';
const BORDER = '#1E2030';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Stats {
  totalBarristers: number;
  activeBarristers: number;
  totalBriefs: number;
  upcomingHearings: number;
  outstandingFees: number;
}

interface Barrister {
  id: string;
  chamberRef: string;
  fullName: string;
  email: string;
  phone: string;
  yearOfCall: number;
  specialisms: string[];
  status: 'active' | 'silk' | 'inactive';
}

interface Brief {
  id: string;
  briefRef: string;
  clientName: string;
  solicitorFirm: string;
  matterType: string;
  courtName: string;
  feeAgreed: number;
  feeStatus: 'pending' | 'invoiced' | 'paid' | 'written_off';
  status:
    | 'instructions_received'
    | 'brief_sent'
    | 'acknowledged'
    | 'hearing_date_set'
    | 'completed';
  hearingDate: string | null;
  barristerId: string;
  barristerName: string;
}

interface DiaryEntry {
  id: string;
  date: string;
  briefRef: string;
  clientName: string;
  courtName: string;
  barristerName: string;
  matterType: string;
}

interface IntakeForm {
  id: string;
  matterRef: string;
  clientName: string;
  clientEmail: string | null;
  matterType: string;
  urgency: string;
  description: string | null;
  createdAt: string;
}

// ── Status helpers ─────────────────────────────────────────────────────────────

const BRIEF_STATUS_ORDER: Brief['status'][] = [
  'instructions_received',
  'brief_sent',
  'acknowledged',
  'hearing_date_set',
  'completed',
];

function nextBriefStatus(current: Brief['status']): Brief['status'] {
  const idx = BRIEF_STATUS_ORDER.indexOf(current);
  return BRIEF_STATUS_ORDER[Math.min(idx + 1, BRIEF_STATUS_ORDER.length - 1)];
}

function briefStatusLabel(s: Brief['status']): string {
  return {
    instructions_received: 'Instructions Received',
    brief_sent: 'Brief Sent',
    acknowledged: 'Acknowledged',
    hearing_date_set: 'Hearing Set',
    completed: 'Completed',
  }[s];
}

function briefStatusClass(s: Brief['status']): string {
  return {
    instructions_received: 'bg-blue-500/15 text-blue-400 border-blue-500/40',
    brief_sent: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/40',
    acknowledged: 'bg-purple-500/15 text-purple-400 border-purple-500/40',
    hearing_date_set: 'bg-orange-500/15 text-orange-400 border-orange-500/40',
    completed: 'bg-green-500/15 text-green-400 border-green-500/40',
  }[s];
}

function feeStatusLabel(s: Brief['feeStatus']): string {
  return { pending: 'Pending', invoiced: 'Invoiced', paid: 'Paid', written_off: 'Written Off' }[s];
}

function feeStatusClass(s: Brief['feeStatus']): string {
  return {
    pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/40',
    invoiced: 'bg-blue-500/15 text-blue-400 border-blue-500/40',
    paid: 'bg-green-500/15 text-green-400 border-green-500/40',
    written_off: 'bg-gray-500/15 text-gray-500 border-gray-500/40',
  }[s];
}

function barristerStatusClass(s: Barrister['status']): string {
  return {
    active: 'bg-green-500/15 text-green-400 border-green-500/40',
    silk: `border text-[${GOLD}]`,
    inactive: 'bg-gray-500/15 text-gray-500 border-gray-500/40',
  }[s];
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);
}

function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Shared sub-components ──────────────────────────────────────────────────────

function Pill({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  gold,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  gold?: boolean;
}) {
  return (
    <Card style={{ backgroundColor: CARD_BG, borderColor: BORDER }}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-400">
          <Icon className="h-4 w-4" style={gold ? { color: GOLD } : undefined} />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="text-3xl font-bold"
          style={{ color: gold ? GOLD : 'white' }}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Card style={{ backgroundColor: CARD_BG, borderColor: BORDER }}>
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-gray-400 text-xs">{label}</Label>
      {children}
    </div>
  );
}

const inputClass =
  'bg-[#0F1014] border-[#1E2030] text-white placeholder:text-gray-600 focus-visible:ring-[#C9A64A]/50';

// ── Tab: Overview ──────────────────────────────────────────────────────────────

function OverviewTab({
  stats,
  diary,
  onRefresh,
}: {
  stats: Stats | null;
  diary: DiaryEntry[];
  onRefresh: () => void;
}) {
  const upcoming = [...diary]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span />
        <button onClick={onRefresh} className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total Barristers" value={stats?.totalBarristers ?? '—'} icon={Users} />
        <StatCard label="Active Barristers" value={stats?.activeBarristers ?? '—'} icon={Users} />
        <StatCard label="Total Briefs" value={stats?.totalBriefs ?? '—'} icon={FileText} />
        <StatCard
          label="Upcoming Hearings (7d)"
          value={stats?.upcomingHearings ?? '—'}
          icon={Calendar}
        />
        <StatCard
          label="Outstanding Fees"
          value={
            stats?.outstandingFees !== undefined
              ? formatCurrency(stats.outstandingFees)
              : '—'
          }
          icon={DollarSign}
          gold
        />
      </div>

      <SectionCard title="Upcoming Diary (next 3)">
        {upcoming.length === 0 ? (
          <p className="py-6 text-center text-gray-500 text-sm">No upcoming hearings.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: BORDER }}>
                  {['Date', 'Brief Ref', 'Client', 'Court', 'Barrister', 'Matter'].map((h) => (
                    <TableHead key={h} className="text-gray-500 text-xs">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcoming.map((e) => (
                  <TableRow key={e.id} style={{ borderColor: BORDER }} className="hover:bg-white/[0.02]">
                    <TableCell className="text-white font-medium">{formatDate(e.date)}</TableCell>
                    <TableCell className="font-mono text-xs" style={{ color: GOLD }}>
                      {e.briefRef}
                    </TableCell>
                    <TableCell className="text-gray-300">{e.clientName}</TableCell>
                    <TableCell className="text-gray-400">{e.courtName}</TableCell>
                    <TableCell className="text-gray-400">{e.barristerName}</TableCell>
                    <TableCell className="text-gray-400">{e.matterType}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ── Tab: Briefs ────────────────────────────────────────────────────────────────

function BriefsTab({
  briefs,
  barristers,
  onRefresh,
  searchBriefs,
  setSearchBriefs,
  filterBriefStatus,
  setFilterBriefStatus,
}: {
  briefs: Brief[];
  barristers: Barrister[];
  onRefresh: () => void;
  searchBriefs: string;
  setSearchBriefs: (v: string) => void;
  filterBriefStatus: string;
  setFilterBriefStatus: (v: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    clientName: '',
    solicitorFirm: '',
    matterType: '',
    courtName: '',
    feeAgreed: '',
    barristerId: '',
  });

  const q = searchBriefs.toLowerCase();
  const filteredBriefs = briefs.filter((b) => {
    const matchesSearch =
      !q ||
      b.clientName.toLowerCase().includes(q) ||
      (b.briefRef ?? '').toLowerCase().includes(q) ||
      b.matterType.toLowerCase().includes(q);
    const matchesStatus = !filterBriefStatus || b.status === filterBriefStatus;
    return matchesSearch && matchesStatus;
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/clerks/briefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, feeAgreed: parseFloat(form.feeAgreed) || 0 }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Brief created successfully');
      setForm({ clientName: '', solicitorFirm: '', matterType: '', courtName: '', feeAgreed: '', barristerId: '' });
      setShowForm(false);
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create brief');
    } finally {
      setSaving(false);
    }
  }

  async function cycleStatus(brief: Brief) {
    const newStatus = nextBriefStatus(brief.status);
    if (newStatus === brief.status) return;
    try {
      const res = await fetch(`/api/clerks/briefs/${brief.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Status updated');
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Briefs</h2>
        <Button
          onClick={() => setShowForm((v) => !v)}
          className="gap-2 text-sm font-semibold"
          style={{ backgroundColor: showForm ? '#1E2030' : GOLD, color: showForm ? 'white' : BG }}
        >
          {showForm ? (
            <>
              <X className="h-4 w-4" /> Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" /> New Brief
            </>
          )}
        </Button>
      </div>

      {showForm && (
        <Card style={{ backgroundColor: CARD_BG, borderColor: BORDER }}>
          <CardHeader>
            <CardTitle className="text-base text-white">New Brief</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FormField label="Client Name *">
                <Input
                  name="clientName"
                  value={form.clientName}
                  onChange={handleChange}
                  required
                  placeholder="John Smith"
                  className={inputClass}
                />
              </FormField>
              <FormField label="Solicitor Firm">
                <Input
                  name="solicitorFirm"
                  value={form.solicitorFirm}
                  onChange={handleChange}
                  placeholder="Smith & Co"
                  className={inputClass}
                />
              </FormField>
              <FormField label="Matter Type *">
                <Input
                  name="matterType"
                  value={form.matterType}
                  onChange={handleChange}
                  required
                  placeholder="Commercial Dispute"
                  className={inputClass}
                />
              </FormField>
              <FormField label="Court Name">
                <Input
                  name="courtName"
                  value={form.courtName}
                  onChange={handleChange}
                  placeholder="Royal Courts of Justice"
                  className={inputClass}
                />
              </FormField>
              <FormField label="Fee Agreed (£)">
                <Input
                  name="feeAgreed"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.feeAgreed}
                  onChange={handleChange}
                  placeholder="5000"
                  className={inputClass}
                />
              </FormField>
              <FormField label="Assign Barrister">
                <select
                  name="barristerId"
                  value={form.barristerId}
                  onChange={handleChange}
                  className={`flex h-9 w-full rounded-md border px-3 py-1 text-sm ${inputClass}`}
                >
                  <option value="">— Select barrister —</option>
                  {barristers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.fullName}
                    </option>
                  ))}
                </select>
              </FormField>
              <div className="col-span-full flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="border-[#1E2030] text-gray-400 hover:bg-white/5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="font-semibold"
                  style={{ backgroundColor: GOLD, color: BG }}
                >
                  {saving ? 'Saving…' : 'Create Brief'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <SectionCard title={`All Briefs (${filteredBriefs.length}${filteredBriefs.length !== briefs.length ? ` of ${briefs.length}` : ''})`}>
        <div className="flex flex-wrap gap-3 mb-4">
          <input type="search" placeholder="Search briefs…" value={searchBriefs}
            onChange={e => setSearchBriefs(e.target.value)}
            className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#C9A64A]/50" />
          <select value={filterBriefStatus} onChange={e => setFilterBriefStatus(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
            <option value="">All statuses</option>
            <option value="instructions_received">Instructions Received</option>
            <option value="brief_sent">Brief Sent</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="hearing_date_set">Hearing Set</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        {briefs.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No briefs yet. Add your first brief above.</p>
          </div>
        ) : filteredBriefs.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p className="text-sm">No briefs match your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: BORDER }}>
                  {['Ref', 'Client', 'Matter', 'Barrister', 'Status', 'Fee Status', 'Hearing', ''].map(
                    (h) => (
                      <TableHead key={h} className="text-gray-500 text-xs">
                        {h}
                      </TableHead>
                    )
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBriefs.map((b) => (
                  <TableRow key={b.id} style={{ borderColor: BORDER }} className="hover:bg-white/[0.02]">
                    <TableCell className="font-mono text-xs" style={{ color: GOLD }}>
                      {b.briefRef}
                    </TableCell>
                    <TableCell className="text-white font-medium">{b.clientName}</TableCell>
                    <TableCell className="text-gray-400">{b.matterType}</TableCell>
                    <TableCell className="text-gray-400">{b.barristerName || '—'}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => cycleStatus(b)}
                        title="Click to advance status"
                        className="cursor-pointer"
                      >
                        <Pill className={briefStatusClass(b.status)}>{briefStatusLabel(b.status)}</Pill>
                      </button>
                    </TableCell>
                    <TableCell>
                      <Pill className={feeStatusClass(b.feeStatus)}>{feeStatusLabel(b.feeStatus)}</Pill>
                    </TableCell>
                    <TableCell className="text-gray-400 text-sm">{formatDate(b.hearingDate)}</TableCell>
                    <TableCell />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ── Tab: Barristers ────────────────────────────────────────────────────────────

function BарristersTab({
  barristers,
  onRefresh,
  searchBarristers,
  setSearchBarristers,
}: {
  barristers: Barrister[];
  onRefresh: () => void;
  searchBarristers: string;
  setSearchBarristers: (v: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    yearOfCall: '',
    specialisms: '',
  });

  const bq = searchBarristers.toLowerCase();
  const filteredBarristers = barristers.filter((b) => {
    if (!bq) return true;
    return (
      b.fullName.toLowerCase().includes(bq) ||
      (b.specialisms ?? []).some((s) => s.toLowerCase().includes(bq))
    );
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const specialisms = form.specialisms
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch('/api/clerks/barristers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, yearOfCall: parseInt(form.yearOfCall) || null, specialisms }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Barrister added');
      setForm({ fullName: '', email: '', phone: '', yearOfCall: '', specialisms: '' });
      setShowForm(false);
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add barrister');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(b: Barrister) {
    const newStatus: Barrister['status'] = b.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`/api/clerks/barristers/${b.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Status updated');
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Barristers</h2>
        <Button
          onClick={() => setShowForm((v) => !v)}
          className="gap-2 text-sm font-semibold"
          style={{ backgroundColor: showForm ? '#1E2030' : GOLD, color: showForm ? 'white' : BG }}
        >
          {showForm ? (
            <>
              <X className="h-4 w-4" /> Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" /> New Barrister
            </>
          )}
        </Button>
      </div>

      {showForm && (
        <Card style={{ backgroundColor: CARD_BG, borderColor: BORDER }}>
          <CardHeader>
            <CardTitle className="text-base text-white">Add Barrister</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FormField label="Full Name *">
                <Input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                  placeholder="Ms Jane Doe KC"
                  className={inputClass}
                />
              </FormField>
              <FormField label="Email">
                <Input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="jane.doe@chambers.com"
                  className={inputClass}
                />
              </FormField>
              <FormField label="Phone">
                <Input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+44 20 1234 5678"
                  className={inputClass}
                />
              </FormField>
              <FormField label="Year of Call">
                <Input
                  name="yearOfCall"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={form.yearOfCall}
                  onChange={handleChange}
                  placeholder="2005"
                  className={inputClass}
                />
              </FormField>
              <FormField label="Specialisms (comma-separated)">
                <Input
                  name="specialisms"
                  value={form.specialisms}
                  onChange={handleChange}
                  placeholder="Commercial, Property, Chancery"
                  className={`${inputClass} sm:col-span-2`}
                />
              </FormField>
              <div className="col-span-full flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="border-[#1E2030] text-gray-400 hover:bg-white/5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="font-semibold"
                  style={{ backgroundColor: GOLD, color: BG }}
                >
                  {saving ? 'Saving…' : 'Add Barrister'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <SectionCard title={`Roster (${filteredBarristers.length}${filteredBarristers.length !== barristers.length ? ` of ${barristers.length}` : ''})`}>
        <div className="flex flex-wrap gap-3 mb-4">
          <input type="search" placeholder="Search barristers…" value={searchBarristers}
            onChange={e => setSearchBarristers(e.target.value)}
            className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#C9A64A]/50" />
        </div>
        {barristers.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No barristers yet. Add your first barrister above.</p>
          </div>
        ) : filteredBarristers.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p className="text-sm">No barristers match your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: BORDER }}>
                  {['Ref', 'Name', 'Email', 'Year of Call', 'Specialisms', 'Status', ''].map((h) => (
                    <TableHead key={h} className="text-gray-500 text-xs">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBarristers.map((b) => (
                  <TableRow key={b.id} style={{ borderColor: BORDER }} className="hover:bg-white/[0.02]">
                    <TableCell className="font-mono text-xs" style={{ color: GOLD }}>
                      {b.chamberRef}
                    </TableCell>
                    <TableCell className="text-white font-medium">{b.fullName}</TableCell>
                    <TableCell className="text-gray-400 text-sm">{b.email || '—'}</TableCell>
                    <TableCell className="text-gray-400">{b.yearOfCall || '—'}</TableCell>
                    <TableCell className="text-gray-400 text-sm max-w-[180px] truncate">
                      {b.specialisms?.join(', ') || '—'}
                    </TableCell>
                    <TableCell>
                      <Pill
                        className={
                          b.status === 'silk'
                            ? 'border-[#C9A64A]/50 text-[#C9A64A] bg-[#C9A64A]/10'
                            : barristerStatusClass(b.status)
                        }
                      >
                        {b.status === 'silk' ? 'Silk (KC)' : b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                      </Pill>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleStatus(b)}
                        className="border-[#1E2030] text-gray-400 hover:bg-white/5 text-xs"
                      >
                        {b.status === 'active' ? 'Deactivate' : 'Activate'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ── Tab: Fees ──────────────────────────────────────────────────────────────────

function FeesTab({ briefs, onRefresh }: { briefs: Brief[]; onRefresh: () => void }) {
  const outstanding = briefs.filter(
    (b) => b.feeStatus !== 'paid' && b.feeStatus !== 'written_off'
  );

  async function markPaid(brief: Brief) {
    try {
      const res = await fetch(`/api/clerks/briefs/${brief.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feeStatus: 'paid' }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(`Fee marked as paid for ${brief.clientName}`);
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to mark as paid');
    }
  }

  // KPI computations
  const totalOutstanding = briefs
    .filter((b) => b.feeStatus === 'pending' || b.feeStatus === 'invoiced')
    .reduce((sum, b) => sum + (b.feeAgreed || 0), 0);

  const recoveredThisMonth = briefs
    .filter((b) => b.feeStatus === 'paid')
    .reduce((sum, b) => sum + (b.feeAgreed || 0), 0);

  const overdueCount = briefs.filter(
    (b) => (b.feeStatus as string) === 'overdue'
  ).length;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">Outstanding Fees</h2>

      {/* KPI summary strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Outstanding</p>
          <p className="text-2xl font-bold" style={{ color: GOLD }}>
            £{Number(totalOutstanding).toLocaleString('en-GB')}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Recovered This Month</p>
          <p className="text-2xl font-bold" style={{ color: GOLD }}>
            £{Number(recoveredThisMonth).toLocaleString('en-GB')}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Overdue</p>
          <p className="text-2xl font-bold" style={{ color: GOLD }}>
            {overdueCount}
          </p>
        </div>
      </div>

      <SectionCard title={`Unpaid Briefs (${outstanding.length})`}>
        {outstanding.length === 0 ? (
          <p className="py-8 text-center text-gray-500 text-sm">All fees have been settled.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: BORDER }}>
                  {['Ref', 'Client', 'Barrister', 'Fee Agreed', 'Fee Status', ''].map((h) => (
                    <TableHead key={h} className="text-gray-500 text-xs">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {outstanding.map((b) => (
                  <TableRow key={b.id} style={{ borderColor: BORDER }} className="hover:bg-white/[0.02]">
                    <TableCell className="font-mono text-xs" style={{ color: GOLD }}>
                      {b.briefRef}
                    </TableCell>
                    <TableCell className="text-white font-medium">{b.clientName}</TableCell>
                    <TableCell className="text-gray-400">{b.barristerName || '—'}</TableCell>
                    <TableCell className="text-white font-semibold">{formatCurrency(b.feeAgreed)}</TableCell>
                    <TableCell>
                      <Pill className={feeStatusClass(b.feeStatus)}>{feeStatusLabel(b.feeStatus)}</Pill>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => markPaid(b)}
                        className="text-xs font-semibold"
                        style={{ backgroundColor: GOLD, color: BG }}
                      >
                        Mark Paid
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ── Tab: Diary ─────────────────────────────────────────────────────────────────

function DiaryTab({ briefs }: { briefs: Brief[] }) {
  // Only briefs with a hearing date set
  const withHearing = briefs
    .filter((b) => !!b.hearingDate)
    .sort((a, b) => new Date(a.hearingDate!).getTime() - new Date(b.hearingDate!).getTime());

  // Week boundaries (start-of-day, Monday-based)
  const now = new Date();
  const todayStr = now.toDateString();

  // Start of this week (Monday)
  const dayOfWeek = now.getDay(); // 0=Sun … 6=Sat
  const diffToMonday = (dayOfWeek + 6) % 7;
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setHours(0, 0, 0, 0);
  startOfThisWeek.setDate(now.getDate() - diffToMonday);

  const startOfNextWeek = new Date(startOfThisWeek);
  startOfNextWeek.setDate(startOfThisWeek.getDate() + 7);

  const startOfLater = new Date(startOfNextWeek);
  startOfLater.setDate(startOfNextWeek.getDate() + 7);

  function weekBucket(dateStr: string): 'this' | 'next' | 'later' {
    const d = new Date(dateStr);
    if (d < startOfNextWeek) return 'this';
    if (d < startOfLater) return 'next';
    return 'later';
  }

  const thisWeek = withHearing.filter((b) => weekBucket(b.hearingDate!) === 'this');
  const nextWeek = withHearing.filter((b) => weekBucket(b.hearingDate!) === 'next');
  const later = withHearing.filter((b) => weekBucket(b.hearingDate!) === 'later');

  function HearingCard({ brief }: { brief: Brief }) {
    const d = new Date(brief.hearingDate!);
    const isToday = d.toDateString() === todayStr;
    const dayName = d.toLocaleDateString('en-GB', { weekday: 'short' });
    const dayNum = d.getDate();
    const month = d.toLocaleDateString('en-GB', { month: 'short' });

    return (
      <div className="flex items-start gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:border-[#C9A64A]/30 transition-colors">
        <div className="w-12 text-center shrink-0">
          <div className="text-xs text-gray-500">{dayName}</div>
          <div className="text-2xl font-bold text-white">{dayNum}</div>
          <div className="text-xs text-gray-500">{month}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-white text-sm">{brief.clientName}</p>
            {isToday && (
              <span
                className="rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{ backgroundColor: `${GOLD}22`, color: GOLD, border: `1px solid ${GOLD}55` }}
              >
                Today
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {brief.barristerName || '—'} · {brief.matterType}
          </p>
          {brief.courtName && (
            <p className="text-xs text-gray-500 mt-0.5">{brief.courtName}</p>
          )}
          <p className="text-xs mt-1" style={{ color: GOLD }}>
            £{Number(brief.feeAgreed).toLocaleString('en-GB')}
          </p>
        </div>
      </div>
    );
  }

  function WeekSection({ label, items }: { label: string; items: Brief[] }) {
    if (items.length === 0) return null;
    return (
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</h3>
        <div className="space-y-2">
          {items.map((b) => (
            <HearingCard key={b.id} brief={b} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">
        Diary &amp; Court Dates
        <span className="ml-2 text-sm font-normal text-gray-500">({withHearing.length} hearings)</span>
      </h2>

      {withHearing.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 py-16 text-center">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30 text-gray-500" />
          <p className="text-sm text-gray-500">No upcoming hearings.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <WeekSection label="This Week" items={thisWeek} />
          <WeekSection label="Next Week" items={nextWeek} />
          <WeekSection label="Later" items={later} />
        </div>
      )}
    </div>
  );
}

// ── Intake Queue Tab ───────────────────────────────────────────────────────────

function IntakeQueueTab({
  forms,
  urgencyClass,
  onConvert,
}: {
  forms: IntakeForm[];
  urgencyClass: Record<string, string>;
  onConvert: (f: IntakeForm) => void;
}) {
  return (
    <SectionCard title="Client Intake Queue" subtitle="Submissions from UltAi — convert to brief with one click">
      {forms.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Inbox className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No pending intake submissions.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: BORDER }}>
                <TableHead className="text-gray-400">Ref</TableHead>
                <TableHead className="text-gray-400">Client</TableHead>
                <TableHead className="text-gray-400">Matter Type</TableHead>
                <TableHead className="text-gray-400">Urgency</TableHead>
                <TableHead className="text-gray-400">Email</TableHead>
                <TableHead className="text-gray-400">Description</TableHead>
                <TableHead className="text-gray-400">Received</TableHead>
                <TableHead className="text-gray-400">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forms.map(f => (
                <TableRow key={f.id} style={{ borderColor: BORDER }} className="hover:bg-white/[0.02]">
                  <TableCell className="font-mono text-xs" style={{ color: GOLD }}>{f.matterRef}</TableCell>
                  <TableCell className="font-medium text-white">{f.clientName}</TableCell>
                  <TableCell className="text-gray-300">{f.matterType}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${urgencyClass[f.urgency] ?? urgencyClass.medium}`}>
                      {f.urgency}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-400">{f.clientEmail ?? '—'}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-gray-400">
                    {f.description ? f.description.slice(0, 60) + (f.description.length > 60 ? '…' : '') : '—'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-gray-500">
                    {new Date(f.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => onConvert(f)}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-90"
                      style={{ backgroundColor: GOLD, color: BG }}
                    >
                      → Convert to Brief
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </SectionCard>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────

type Tab = 'overview' | 'intake' | 'briefs' | 'barristers' | 'fees' | 'diary';

export default function ClerkDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [barristers, setBarristers] = useState<Barrister[]>([]);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [diary, setDiary] = useState<DiaryEntry[]>([]);
  const [intakeForms, setIntakeForms] = useState<IntakeForm[]>([]);

  // Search / filter state
  const [searchBriefs, setSearchBriefs] = useState('');
  const [filterBriefStatus, setFilterBriefStatus] = useState('');
  const [searchBarristers, setSearchBarristers] = useState('');

  async function fetchAll(showRefreshing = false) {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const [statsRes, barristersRes, briefsRes, diaryRes, intakeRes] = await Promise.all([
        fetch('/api/clerks/stats'),
        fetch('/api/clerks/barristers'),
        fetch('/api/clerks/briefs'),
        fetch('/api/clerks/diary'),
        fetch('/api/admin/intake-forms'),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (barristersRes.ok) setBarristers(await barristersRes.json());
      if (briefsRes.ok) setBriefs(await briefsRes.json());
      if (diaryRes.ok) setDiary(await diaryRes.json());
      if (intakeRes.ok) setIntakeForms(await intakeRes.json());
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  function handleRefresh() {
    fetchAll(true);
  }

  async function convertIntakeToBrief(form: IntakeForm) {
    try {
      const res = await fetch('/api/clerks/briefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: form.clientName,
          matterType: form.matterType,
          solicitorFirm: '',
          notes: form.description ?? '',
        }),
      });
      if (!res.ok) throw new Error();
      const brief = await res.json();
      toast.success(`Brief created: ${brief.briefRef}`);
      fetchAll(true);
    } catch {
      toast.error('Failed to create brief');
    }
  }

  const urgencyClass: Record<string, string> = {
    low: 'bg-gray-500/20 text-gray-400 border-gray-500/40',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    critical: 'bg-red-500/20 text-red-400 border-red-500/40',
  };

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'intake', label: `Intake Queue${intakeForms.length ? ` (${intakeForms.length})` : ''}`, icon: FileText },
    { id: 'briefs', label: 'Briefs', icon: FileText },
    { id: 'barristers', label: 'Barristers', icon: Users },
    { id: 'fees', label: 'Fees', icon: DollarSign },
    { id: 'diary', label: 'Diary', icon: Calendar },
  ];

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: BG, color: 'white' }}>
      <SEO title="Clerk Dashboard" description="Law Clerks chambers management dashboard." />
      <h1 className="sr-only">Law Clerks — Chambers Management Dashboard</h1>
      {/* Top nav */}
      <nav
        className="sticky top-0 z-40 border-b backdrop-blur"
        style={{ borderColor: BORDER, backgroundColor: `${BG}E6` }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation('/law-clerks')}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <span className="text-lg font-bold" style={{ color: GOLD }}>
              Law Clerks
            </span>
            <span className="hidden text-gray-600 sm:inline">|</span>
            <span className="hidden text-sm text-gray-400 sm:inline">Chambers Dashboard</span>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            className="gap-2 border-[#1E2030] text-gray-400 hover:bg-white/5"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Tab bar */}
        <div className="mb-8 flex gap-1 overflow-x-auto rounded-xl border p-1" style={{ borderColor: BORDER, backgroundColor: CARD_BG }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex flex-shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all"
              style={
                activeTab === id
                  ? { backgroundColor: GOLD, color: BG }
                  : { color: '#9CA3AF' }
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <PageSkeleton />
        ) : (
          <>
            {activeTab === 'intake' && (
              <IntakeQueueTab
                forms={intakeForms}
                urgencyClass={urgencyClass}
                onConvert={convertIntakeToBrief}
              />
            )}
            {activeTab === 'overview' && (
              <OverviewTab stats={stats} diary={diary} onRefresh={handleRefresh} />
            )}
            {activeTab === 'briefs' && (
              <BriefsTab
                briefs={briefs}
                barristers={barristers}
                onRefresh={handleRefresh}
                searchBriefs={searchBriefs}
                setSearchBriefs={setSearchBriefs}
                filterBriefStatus={filterBriefStatus}
                setFilterBriefStatus={setFilterBriefStatus}
              />
            )}
            {activeTab === 'barristers' && (
              <BарristersTab
                barristers={barristers}
                onRefresh={handleRefresh}
                searchBarristers={searchBarristers}
                setSearchBarristers={setSearchBarristers}
              />
            )}
            {activeTab === 'fees' && (
              <FeesTab briefs={briefs} onRefresh={handleRefresh} />
            )}
            {activeTab === 'diary' && <DiaryTab briefs={briefs} />}
          </>
        )}
      </div>
    </div>
  );
}
