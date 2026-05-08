import { useState } from 'react';
import { useLocation } from 'wouter';
import { Shield, Bell, Search, Plus, Building2, Calendar, AlertTriangle, CheckCircle, TrendingUp, Wifi, WifiOff, Clock, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ─── Data ───────────────────────────────────────────────────────────────────

type Status = 'At risk' | 'Due soon' | 'Compliant';

interface Company {
  id: number;
  name: string;
  companyNumber: string;
  nextFiling: string;
  dueDate: string;
  daysRemaining: number;
  status: Status;
}

const COMPANIES: Company[] = [
  { id: 1,  name: 'Harrington Infrastructure PLC',  companyNumber: '12345678', nextFiling: 'Confirmation Statement', dueDate: '14 May 2026',  daysRemaining: 6,   status: 'At risk'   },
  { id: 2,  name: 'Meridian Capital Group Ltd',      companyNumber: '87654321', nextFiling: 'Annual Accounts',        dueDate: '6 Jun 2026',   daysRemaining: 29,  status: 'Due soon'  },
  { id: 3,  name: 'Blackwood Financial Services',    companyNumber: '11223344', nextFiling: 'Confirmation Statement', dueDate: '25 Aug 2026',  daysRemaining: 109, status: 'Compliant' },
  { id: 4,  name: 'Oakbridge Holdings Ltd',          companyNumber: '99887766', nextFiling: 'Annual Accounts',        dueDate: '3 Sep 2026',   daysRemaining: 118, status: 'Compliant' },
  { id: 5,  name: 'Sterling Asset Management',       companyNumber: '55443322', nextFiling: 'Confirmation Statement', dueDate: '12 May 2026',  daysRemaining: 4,   status: 'At risk'   },
  { id: 6,  name: 'Pemberton Law LLP',               companyNumber: '66554433', nextFiling: 'Annual Accounts',        dueDate: '15 Jul 2026',  daysRemaining: 68,  status: 'Compliant' },
  { id: 7,  name: 'Ashford Properties Ltd',          companyNumber: '77665544', nextFiling: 'Confirmation Statement', dueDate: '1 Jun 2026',   daysRemaining: 24,  status: 'Due soon'  },
  { id: 8,  name: 'Trent Digital Solutions',         companyNumber: '22334455', nextFiling: 'Annual Accounts',        dueDate: '30 Jul 2026',  daysRemaining: 83,  status: 'Compliant' },
  { id: 9,  name: 'Wyndham Consulting Ltd',          companyNumber: '33445566', nextFiling: 'Confirmation Statement', dueDate: '8 Jun 2026',   daysRemaining: 31,  status: 'Due soon'  },
  { id: 10, name: 'Crown Logistics Group',           companyNumber: '44556677', nextFiling: 'Annual Accounts',        dueDate: '14 Oct 2026',  daysRemaining: 159, status: 'Compliant' },
  { id: 11, name: 'Belmont Legal Services',          companyNumber: '55667788', nextFiling: 'Confirmation Statement', dueDate: '22 Sep 2026',  daysRemaining: 137, status: 'Compliant' },
  { id: 12, name: 'Forth Bridge Capital',            companyNumber: '66778899', nextFiling: 'Annual Accounts',        dueDate: '29 Jun 2026',  daysRemaining: 52,  status: 'Due soon'  },
];

const UPCOMING_DEADLINES = COMPANIES
  .slice()
  .sort((a, b) => a.daysRemaining - b.daysRemaining)
  .slice(0, 5);

// ─── Helper utilities ────────────────────────────────────────────────────────

function statusRowBg(status: Status): string {
  if (status === 'At risk')  return 'bg-red-50';
  if (status === 'Due soon') return 'bg-amber-50';
  return 'bg-white';
}

function daysColor(days: number): string {
  if (days <= 14) return 'text-red-600 font-bold';
  if (days <= 30) return 'text-amber-600 font-bold';
  return 'text-green-600';
}

function statusBadge(status: Status) {
  if (status === 'At risk') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
        <AlertTriangle className="w-3 h-3" />
        At risk
      </span>
    );
  }
  if (status === 'Due soon') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
        <Clock className="w-3 h-3" />
        Due soon
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
      <CheckCircle className="w-3 h-3" />
      Compliant
    </span>
  );
}

function daysBadge(days: number) {
  if (days <= 14) {
    return <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">{days}d</span>;
  }
  if (days <= 30) {
    return <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700">{days}d</span>;
  }
  return <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700">{days}d</span>;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

type Tab = 'Overview' | 'Companies' | 'Filings' | 'Alerts' | 'Reports';
const NAV_TABS: Tab[] = ['Overview', 'Companies', 'Filings', 'Alerts', 'Reports'];

function Header({ activeTab, setActiveTab }: { activeTab: Tab; setActiveTab: (t: Tab) => void }) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Shield className="w-7 h-7 text-[#C9A64A]" />
            <span className="text-xl font-bold text-[#1A1A1A]">FineGuard</span>
          </div>

          {/* Nav tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-[#C9A64A]/10 text-[#C9A64A]'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="w-8 h-8 rounded-full bg-[#C9A64A] flex items-center justify-center text-white text-sm font-bold">
                AC
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function StatCard({
  label,
  value,
  subtext,
  borderColor,
  icon,
}: {
  label: string;
  value: string | number;
  subtext: string;
  borderColor: string;
  icon: React.ReactNode;
}) {
  return (
    <div className={`bg-white border border-gray-200 border-l-4 ${borderColor} rounded-2xl shadow-sm p-5 flex items-start gap-4`}>
      <div className="mt-0.5 text-gray-400">{icon}</div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-3xl font-bold text-[#1A1A1A] leading-none my-1">{value}</p>
        <p className="text-xs text-gray-400">{subtext}</p>
      </div>
    </div>
  );
}

function CompanyTable() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Table header actions */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search companies..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#C9A64A]/40 focus:border-[#C9A64A]"
          />
        </div>
        <Button
          size="sm"
          className="bg-[#C9A64A] hover:bg-[#b8954a] text-white gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Company
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Company</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Co. No.</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Next Filing</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Due Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Days</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {COMPANIES.map((c) => (
              <tr key={c.id} className={`${statusRowBg(c.status)} hover:brightness-95 transition-all`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="font-medium text-[#1A1A1A] text-xs leading-tight">{c.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs hidden lg:table-cell">{c.companyNumber}</td>
                <td className="px-4 py-3 text-gray-600 text-xs hidden md:table-cell">{c.nextFiling}</td>
                <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{c.dueDate}</td>
                <td className={`px-4 py-3 text-xs ${daysColor(c.daysRemaining)}`}>{c.daysRemaining}</td>
                <td className="px-4 py-3">{statusBadge(c.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilingCalendar() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-[#C9A64A]" />
        <h3 className="font-semibold text-[#1A1A1A] text-sm">Filing Calendar</h3>
        <span className="ml-auto text-xs text-gray-400">Next 5 deadlines</span>
      </div>
      <div className="space-y-2">
        {UPCOMING_DEADLINES.map((c) => (
          <div
            key={c.id}
            className={`flex items-center justify-between p-3 rounded-xl border ${
              c.status === 'At risk'
                ? 'bg-red-50 border-red-100'
                : c.status === 'Due soon'
                ? 'bg-amber-50 border-amber-100'
                : 'bg-gray-50 border-gray-100'
            }`}
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#1A1A1A] truncate">{c.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{c.nextFiling} · {c.dueDate}</p>
            </div>
            <div className="ml-3 shrink-0">{daysBadge(c.daysRemaining)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface RiskBar {
  label: string;
  count: number;
  widthPct: number;
  barColor: string;
  textColor: string;
}

const RISK_BARS: RiskBar[] = [
  { label: 'High risk (≤14 days)',    count: 2,  widthPct: 16,  barColor: 'bg-red-500',   textColor: 'text-red-600'  },
  { label: 'Medium risk (15–30 days)', count: 5,  widthPct: 40,  barColor: 'bg-amber-400', textColor: 'text-amber-600' },
  { label: 'Low risk (31–90 days)',   count: 12, widthPct: 65,  barColor: 'bg-blue-400',  textColor: 'text-blue-600' },
  { label: 'Compliant (>90 days)',    count: 19, widthPct: 100, barColor: 'bg-green-500', textColor: 'text-green-600' },
];

function PenaltyRiskBreakdown() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-[#C9A64A]" />
        <h3 className="font-semibold text-[#1A1A1A] text-sm">Penalty Risk Breakdown</h3>
      </div>
      <div className="space-y-3">
        {RISK_BARS.map((bar) => (
          <div key={bar.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">{bar.label}</span>
              <span className={`text-xs font-bold ${bar.textColor}`}>{bar.count}</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${bar.barColor} rounded-full transition-all duration-700`}
                style={{ width: `${bar.widthPct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentAlerts() {
  const alerts = [
    {
      id: 1,
      dot: 'bg-red-500',
      title: 'Harrington Infrastructure',
      message: 'Confirmation due in 6 days',
      urgency: null,
    },
    {
      id: 2,
      dot: 'bg-amber-400',
      title: 'Sterling Asset Management',
      message: 'Confirmation due in 4 days',
      urgency: 'URGENT',
    },
    {
      id: 3,
      dot: 'bg-green-500',
      title: 'Crown Logistics',
      message: 'Annual accounts filed successfully',
      urgency: null,
    },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-4 h-4 text-[#C9A64A]" />
        <h3 className="font-semibold text-[#1A1A1A] text-sm">Recent Alerts</h3>
        <Badge className="ml-auto bg-gray-100 text-gray-500 border-0 text-xs">3</Badge>
      </div>
      <div className="space-y-3">
        {alerts.map((a) => (
          <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <span className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${a.dot}`} />
            <div>
              <p className="text-xs font-semibold text-[#1A1A1A]">
                {a.title}
                {a.urgency && (
                  <span className="ml-2 text-xs font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                    {a.urgency}
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{a.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IntegrationStatusBar() {
  const integrations = [
    {
      id: 'ch',
      label: 'Companies House API',
      status: 'Connected',
      icon: <Wifi className="w-3.5 h-3.5" />,
      pill: 'bg-green-100 text-green-700 border-green-200',
      dot: 'bg-green-500',
    },
    {
      id: 'hmrc',
      label: 'HMRC API',
      status: 'Not configured',
      icon: <WifiOff className="w-3.5 h-3.5" />,
      pill: 'bg-gray-100 text-gray-500 border-gray-200',
      dot: 'bg-gray-400',
    },
    {
      id: 'wh',
      label: 'Webhook',
      status: '2 pending',
      icon: <Clock className="w-3.5 h-3.5" />,
      pill: 'bg-amber-100 text-amber-700 border-amber-200',
      dot: 'bg-amber-400',
    },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 flex flex-wrap items-center gap-3">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-1">Integrations</span>
      {integrations.map((i) => (
        <div
          key={i.id}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${i.pill}`}
        >
          <span className={`w-2 h-2 rounded-full ${i.dot}`} />
          {i.icon}
          <span>{i.label}</span>
          <span className="font-bold">·</span>
          <span>{i.status}</span>
        </div>
      ))}
    </div>
  );
}

function ComingSoon({ tab }: { tab: Tab }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-gray-400">
      <Shield className="w-12 h-12 mb-4 text-[#C9A64A]/40" />
      <p className="text-lg font-semibold text-gray-500">{tab}</p>
      <p className="text-sm mt-1">Coming soon</p>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function FineGuardDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab !== 'Overview' ? (
          <ComingSoon tab={activeTab} />
        ) : (
          <div className="space-y-6">
            {/* Page title */}
            <div>
              <h1 className="text-2xl font-bold text-[#1A1A1A]">Compliance Overview</h1>
              <p className="text-sm text-gray-400 mt-0.5">Monitoring 38 companies across your portfolio</p>
            </div>

            {/* Summary stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard
                label="Monitored Companies"
                value={38}
                subtext="+3 this month"
                borderColor="border-l-gray-400"
                icon={<Building2 className="w-5 h-5" />}
              />
              <StatCard
                label="At Risk"
                value={2}
                subtext="Action required"
                borderColor="border-l-red-500"
                icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
              />
              <StatCard
                label="Due in 30 Days"
                value={7}
                subtext="Plan ahead"
                borderColor="border-l-amber-400"
                icon={<Clock className="w-5 h-5 text-amber-400" />}
              />
              <StatCard
                label="Compliant"
                value={29}
                subtext="76% of portfolio"
                borderColor="border-l-green-500"
                icon={<CheckCircle className="w-5 h-5 text-green-500" />}
              />
            </div>

            {/* Main panel: table + side panels */}
            <div className="flex flex-col xl:flex-row gap-6">
              {/* Left 60% — company table */}
              <div className="xl:w-[60%]">
                <CompanyTable />
              </div>

              {/* Right 40% — side panels */}
              <div className="xl:w-[40%] flex flex-col gap-5">
                <FilingCalendar />
                <PenaltyRiskBreakdown />
                <RecentAlerts />
              </div>
            </div>

            {/* Integration status bar */}
            <IntegrationStatusBar />
          </div>
        )}
      </main>
    </div>
  );
}
