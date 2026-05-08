import { Link } from 'wouter';
import {
  Shield,
  Brain,
  Bell,
  Scale,
  Settings,
  BellRing,
  Upload,
  FilePlus,
  CalendarPlus,
  MonitorPlay,
  FileCheck,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  Circle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ─── Greeting ────────────────────────────────────────────────────────────────
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

// ─── Product cards ────────────────────────────────────────────────────────────
interface ProductStat {
  label: string;
  value: string;
}

interface Product {
  name: string;
  tagline: string;
  icon: React.ReactNode;
  accent: string;
  route: string;
  stats: ProductStat[];
  status: 'operational' | 'alert';
  alertCount?: number;
}

const PRODUCTS: Product[] = [
  {
    name: 'VaultLine Cloud',
    tagline: 'Document vault & compliance tracking',
    icon: <Shield className="w-7 h-7" />,
    accent: '#5A4BFF',
    route: '/vaultline',
    stats: [
      { label: 'Documents', value: '2,847' },
      { label: 'Compliant', value: '94%' },
      { label: 'Storage used', value: '12.4 GB' },
    ],
    status: 'operational',
  },
  {
    name: 'UltAi',
    tagline: 'AI-powered contract analysis',
    icon: <Brain className="w-7 h-7" />,
    accent: '#00D4FF',
    route: '/ultai',
    stats: [
      { label: 'Contracts', value: '147' },
      { label: 'Flagged', value: '23' },
      { label: 'Expiring soon', value: '4' },
    ],
    status: 'alert',
    alertCount: 1,
  },
  {
    name: 'FineGuard',
    tagline: 'Companies House compliance alerts',
    icon: <Bell className="w-7 h-7" />,
    accent: '#C9A64A',
    route: '/fineguard',
    stats: [
      { label: 'Companies', value: '38' },
      { label: 'At risk', value: '2' },
      { label: 'Fines YTD', value: '£0' },
    ],
    status: 'operational',
  },
  {
    name: 'ClerkOS',
    tagline: 'Multi-tenant court case management',
    icon: <Scale className="w-7 h-7" />,
    accent: '#10B981',
    route: '/',
    stats: [
      { label: 'Cases', value: '142' },
      { label: 'Hearings today', value: '7' },
      { label: 'Pending review', value: '5' },
    ],
    status: 'operational',
  },
];

// ─── Quick actions ─────────────────────────────────────────────────────────────
interface QuickAction {
  label: string;
  icon: React.ReactNode;
  route: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Upload Document', icon: <Upload className="w-5 h-5" />, route: '/vaultline' },
  { label: 'New Case', icon: <FilePlus className="w-5 h-5" />, route: '/cases' },
  { label: 'Schedule Hearing', icon: <CalendarPlus className="w-5 h-5" />, route: '/hearings' },
  { label: 'Book Demo', icon: <MonitorPlay className="w-5 h-5" />, route: '/book-demo' },
  { label: 'Compliance Bundle', icon: <FileCheck className="w-5 h-5" />, route: '/compliance-bundle' },
  { label: 'Intake Form', icon: <ClipboardList className="w-5 h-5" />, route: '/intake' },
  { label: 'Lunar Intake', icon: <Brain className="w-5 h-5" />, route: '/lunar-intake' },
];

// ─── Activity feed ─────────────────────────────────────────────────────────────
type ActivityType = 'case' | 'document' | 'hearing' | 'alert' | 'analysis' | 'lead' | 'bundle' | 'vault';

interface Activity {
  type: ActivityType;
  description: string;
  timeAgo: string;
  actor: string;
}

const ACTIVITY: Activity[] = [
  {
    type: 'case',
    description: 'Case REF-2026-001 transitioned to In Progress',
    timeAgo: '2m ago',
    actor: 'admin@court.local',
  },
  {
    type: 'document',
    description: 'Document exhibit-a.pdf uploaded to REF-2026-001',
    timeAgo: '15m ago',
    actor: 'clerk@court.local',
  },
  {
    type: 'hearing',
    description: 'Hearing scheduled: Court 1, 14 May 2026',
    timeAgo: '1h ago',
    actor: 'admin@court.local',
  },
  {
    type: 'alert',
    description: 'FineGuard alert: Harrington PLC confirmation due in 8 days',
    timeAgo: '2h ago',
    actor: 'system',
  },
  {
    type: 'analysis',
    description: 'UltAi analysed Services_Agreement_v3.pdf — risk score 73',
    timeAgo: '3h ago',
    actor: 'legal@firm.io',
  },
  {
    type: 'lead',
    description: 'New lead: james.porter@meridian.co.uk (FineGuard)',
    timeAgo: '5h ago',
    actor: 'system',
  },
  {
    type: 'bundle',
    description: 'Compliance bundle generated for REF-2026-003',
    timeAgo: 'yesterday',
    actor: 'clerk@court.local',
  },
  {
    type: 'vault',
    description: 'VaultLine: 3 documents flagged for retention review',
    timeAgo: 'yesterday',
    actor: 'system',
  },
];

const ACTIVITY_BADGE_STYLES: Record<ActivityType, string> = {
  case: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  document: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  hearing: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  alert: 'bg-red-500/20 text-red-300 border-red-500/30',
  analysis: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  lead: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  bundle: 'bg-slate-400/20 text-slate-300 border-slate-400/30',
  vault: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function Portal() {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#0F1014] text-white">
      {/* ── Sticky header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#0F1014]/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-white font-semibold text-sm sm:text-base truncate">
              {getGreeting()}, Alex
            </span>
            <span className="text-white/30 hidden sm:inline">·</span>
            <span className="text-white/50 text-sm hidden sm:inline">VaultLine Brand Suite</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8"
              aria-label="Notifications"
            >
              <BellRing className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* ── Product suite cards ───────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">
            Your products
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PRODUCTS.map((p) => (
              <div
                key={p.name}
                className="rounded-2xl border border-white/10 bg-[#1A1D28] p-6 flex flex-col gap-4"
                style={{ borderLeftColor: p.accent, borderLeftWidth: 4 }}
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl"
                      style={{ backgroundColor: `${p.accent}22`, color: p.accent }}
                    >
                      {p.icon}
                    </div>
                    <div>
                      <div className="font-semibold text-white leading-tight">{p.name}</div>
                      <div className="text-xs text-white/50 mt-0.5">{p.tagline}</div>
                    </div>
                  </div>
                  {p.status === 'operational' ? (
                    <span className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2.5 py-0.5">
                      <Circle className="w-1.5 h-1.5 fill-emerald-400" />
                      Operational
                    </span>
                  ) : (
                    <span className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full px-2.5 py-0.5">
                      <Circle className="w-1.5 h-1.5 fill-amber-400" />
                      {p.alertCount} alert
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                  {p.stats.map((s) => (
                    <div key={s.label} className="bg-white/5 rounded-xl px-3 py-2.5 text-center">
                      <div className="text-sm font-semibold text-white leading-tight">{s.value}</div>
                      <div className="text-xs text-white/40 mt-0.5 leading-tight">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Open button */}
                <div className="flex justify-end">
                  <Link href={p.route}>
                    <Button
                      size="sm"
                      className="text-white border-white/10 hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: p.accent }}
                    >
                      Open
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Quick actions ─────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">
            Quick actions
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.label} href={action.route}>
                <div className="flex-shrink-0 rounded-xl bg-white/5 border border-white/10 px-4 py-3 flex flex-col items-center gap-1.5 text-xs text-gray-300 hover:bg-white/10 transition-all cursor-pointer w-28">
                  <span className="text-white/60">{action.icon}</span>
                  <span className="text-center leading-tight">{action.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Recent activity ───────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">
            Recent activity
          </h2>
          <div className="rounded-2xl border border-white/10 bg-[#1A1D28] overflow-hidden">
            <ul className="divide-y divide-white/5">
              {ACTIVITY.map((item, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors"
                >
                  {/* Type badge */}
                  <span
                    className={`flex-shrink-0 inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold capitalize ${ACTIVITY_BADGE_STYLES[item.type]}`}
                  >
                    {item.type}
                  </span>
                  {/* Description */}
                  <span className="flex-1 text-sm text-white/80 min-w-0 truncate">
                    {item.description}
                  </span>
                  {/* Time + actor */}
                  <div className="flex-shrink-0 flex items-center gap-3 text-xs text-white/40 hidden sm:flex">
                    <span>{item.timeAgo}</span>
                    <span className="truncate max-w-[140px]">{item.actor}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      {/* ── System status footer ──────────────────────────────────────── */}
      <footer className="border-t border-white/10 bg-[#0F1014] mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-5 flex-wrap">
            {/* Database */}
            <span className="flex items-center gap-1.5 text-xs text-white/50">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Database
            </span>
            {/* Azure Services */}
            <span className="flex items-center gap-1.5 text-xs text-white/50">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Azure Services
            </span>
            {/* Companies House API */}
            <span className="flex items-center gap-1.5 text-xs text-white/50">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Companies House API
              <span className="text-amber-400 font-medium">Degraded</span>
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/30">
            <span>v2.4.1</span>
            <span>{today}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
