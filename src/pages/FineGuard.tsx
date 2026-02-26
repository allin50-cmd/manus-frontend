import { useLocation } from 'wouter';
import {
  Shield, CheckCircle, ArrowRight, Zap, Lock,
  Calendar, Bell, FileCheck, GitBranch, Users,
  Building2, Mail, Globe, Bot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const WHY_ITEMS = [
  {
    icon: <CheckCircle className="h-5 w-5 text-brand-gold" />,
    heading: 'Built for UK accountancy',
    body: 'Tracks UK statutory deadlines, HMRC cycles, Companies House filings, payroll schedules, VAT windows, and more.',
  },
  {
    icon: <ArrowRight className="h-5 w-5 text-brand-gold" />,
    heading: 'A digital bridge for traditional practices',
    body: 'Move from paper and spreadsheets to automated workflows without disrupting how staff work today.',
  },
  {
    icon: <Building2 className="h-5 w-5 text-brand-gold" />,
    heading: 'Microsoft 365-native',
    body: 'Runs entirely inside your tenant using SharePoint, Teams, Power Automate, Azure Functions, and Entra ID. No external data storage.',
  },
  {
    icon: <FileCheck className="h-5 w-5 text-brand-gold" />,
    heading: 'MTD-ready',
    body: 'Provides the digital records, automation, and audit trail required for Making Tax Digital (MTD ITSA).',
  },
  {
    icon: <Zap className="h-5 w-5 text-brand-gold" />,
    heading: 'Deploys in minutes',
    body: 'The FineGuard Installer Portal deploys into any tenant in under an hour, with live logging and automation steps.',
  },
];

const FEATURES = [
  {
    icon: <Calendar className="h-6 w-6" />,
    title: 'Automated Compliance Engine',
    desc: 'Calculates deadlines, monitors obligations, and keeps filing calendars up to date automatically.',
  },
  {
    icon: <Bell className="h-6 w-6" />,
    title: 'Teams-based Alerts & Collaboration',
    desc: 'Instant reminders where staff already work — no new tools to learn.',
  },
  {
    icon: <Calendar className="h-6 w-6" />,
    title: 'Filing Calendar & Client Dashboards',
    desc: 'Real-time visibility across all clients and teams in a single view.',
  },
  {
    icon: <GitBranch className="h-6 w-6" />,
    title: 'Workflow Automation',
    desc: 'Standardised digital workflows streamline your practice end to end.',
  },
  {
    icon: <FileCheck className="h-6 w-6" />,
    title: 'Audit Trail',
    desc: 'Every compliance action recorded for complete transparency and regulatory readiness.',
  },
  {
    icon: <Bot className="h-6 w-6" />,
    title: 'Optional Copilot Integration',
    desc: 'Smart compliance insights powered by Microsoft AI — available on eligible plans.',
  },
];

const M365_TOOLS = [
  'SharePoint',
  'Teams',
  'Power Automate',
  'Azure Functions',
  'Entra ID (Azure AD)',
];

const SECURITY_ITEMS = [
  'All data stays inside your Microsoft 365 tenant',
  'Uses Microsoft-grade identity and access controls',
  'Zero third-party data storage',
  'Full audit logs',
];

export default function FineGuard() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Shield className="h-7 w-7 text-brand-gold" />
            <span className="text-lg font-bold text-gray-900 tracking-tight">FineGuard</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-gray-600 md:flex">
            <a href="#features" className="hover:text-brand-gold transition-colors">Features</a>
            <a href="#security"  className="hover:text-brand-gold transition-colors">Security</a>
            <a href="#partners"  className="hover:text-brand-gold transition-colors">Partners</a>
            <a href="/about"     className="hover:text-brand-gold transition-colors">About</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/compliance-bundle')}>
              Get Bundle
            </Button>
            <Button size="sm" onClick={() => navigate('/app/deploy')}>
              Deploy Now
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-brand-navy via-brand-navy-light to-[#0A2540] py-24 text-white">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-gold/30 bg-brand-gold/10 px-4 py-1.5 text-sm font-medium text-brand-gold">
            <Zap className="h-3.5 w-3.5" /> Microsoft 365-native · UK compliance
          </div>
          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-6xl">
            Your Digital Bridge from<br />
            <span className="text-brand-gold">Spreadsheets to Modern Compliance</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-300">
            FineGuard is the Microsoft 365-native compliance automation platform for UK accountancy
            firms. Replace manual spreadsheets, email reminders, and inconsistent workflows with
            automated deadlines, smart workflows, and full visibility — all running securely inside
            your Microsoft 365 tenant.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" onClick={() => navigate('/app/deploy')}>
              Deploy FineGuard <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/book-demo')}
              className="border-white/30 text-white hover:bg-white/10 hover:text-white"
            >
              Book a Demo
            </Button>
          </div>
        </div>
      </section>

      {/* ── Why FineGuard ── */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 text-center">
            <h2 className="mb-3 text-3xl font-bold text-gray-900">Why Firms Choose FineGuard</h2>
            <p className="mx-auto max-w-xl text-gray-500">
              Built from the ground up for UK accountancy practices of every size.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WHY_ITEMS.map((item) => (
              <div
                key={item.heading}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-gold/10">
                  {item.icon}
                </div>
                <h3 className="mb-2 text-sm font-semibold text-gray-900">{item.heading}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.body}</p>
              </div>
            ))}

            {/* M365-native card */}
            <div className="rounded-xl border border-brand-gold/30 bg-brand-navy p-6 shadow-sm lg:col-span-1">
              <h3 className="mb-3 text-sm font-semibold text-white">Microsoft 365 Stack</h3>
              <ul className="space-y-2">
                {M365_TOOLS.map((t) => (
                  <li key={t} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle className="h-4 w-4 text-brand-gold shrink-0" /> {t}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-slate-500">No external data storage. No third-party silos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── What FineGuard Delivers ── */}
      <section className="bg-brand-surface py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 text-center">
            <h2 className="mb-3 text-3xl font-bold text-gray-900">What FineGuard Delivers</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl bg-white p-6 border border-gray-200 shadow-sm">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-gold/10 text-brand-gold">
                  {f.icon}
                </div>
                <h3 className="mb-1.5 font-semibold text-gray-900">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security ── */}
      <section id="security" className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex flex-col items-center gap-10 md:flex-row">
            <div className="flex-1">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-navy">
                <Lock className="h-7 w-7 text-brand-gold" />
              </div>
              <h2 className="mb-4 text-3xl font-bold text-gray-900">Security You Can Trust</h2>
              <p className="mb-6 text-gray-500 leading-relaxed">
                FineGuard never stores your data outside your own Microsoft 365 tenant. Your
                clients' information stays in your control, protected by Microsoft-grade security.
              </p>
              <ul className="space-y-3">
                {SECURITY_ITEMS.map((s) => (
                  <li key={s} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <CheckCircle className="mt-0.5 h-4 w-4 text-green-500 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 rounded-2xl border border-brand-gold/30 bg-brand-navy p-8">
              <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-brand-gold">
                Zero-trust architecture
              </p>
              <p className="text-slate-300 text-sm leading-relaxed">
                Identity and access is handled entirely by Entra ID (Azure AD). FineGuard inherits
                your organisation's existing conditional access policies, MFA requirements, and
                role-based access controls.
              </p>
              <div className="mt-6 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs font-mono text-slate-400">Authentication header</p>
                <p className="mt-1 text-xs font-mono text-green-400">x-ms-client-principal</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── For Partners ── */}
      <section id="partners" className="bg-brand-surface py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl rounded-2xl border border-brand-gold/30 bg-brand-navy p-10 text-center">
            <Users className="mx-auto mb-4 h-10 w-10 text-brand-gold" />
            <h2 className="mb-3 text-2xl font-bold text-white">For Partners</h2>
            <p className="mx-auto mb-6 max-w-xl text-slate-300 text-sm leading-relaxed">
              FineGuard offers multi-tenant management, deployment automation, and recurring revenue
              opportunities for Microsoft partners and accountancy technology providers.
            </p>
            <Button onClick={() => navigate('/app/partners')}>
              Explore the Partner Programme <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">Get Started Today</h2>
          <p className="mb-8 text-gray-500">
            Deploy FineGuard into your Microsoft 365 tenant in under an hour using the Installer
            Portal, or request a live demo from our team.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" onClick={() => navigate('/app/deploy')}>
              Open Installer Portal <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/book-demo')}>
              Request a Demo
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-white py-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <Shield className="h-6 w-6 text-brand-gold" />
              <span className="font-bold text-gray-900">FineGuard</span>
            </div>
            <div className="flex flex-wrap gap-5 text-sm text-gray-500">
              <a href="https://fineguard.co.uk" target="_blank" rel="noreferrer"
                className="flex items-center gap-1 hover:text-brand-gold transition-colors">
                <Globe className="h-3.5 w-3.5" /> fineguard.co.uk
              </a>
              <a href="mailto:info@fineguard.co.uk"
                className="flex items-center gap-1 hover:text-brand-gold transition-colors">
                <Mail className="h-3.5 w-3.5" /> info@fineguard.co.uk
              </a>
              <a href="mailto:partners@fineguard.co.uk"
                className="flex items-center gap-1 hover:text-brand-gold transition-colors">
                <Users className="h-3.5 w-3.5" /> Partner Programme
              </a>
            </div>
          </div>
          <p className="mt-6 text-xs text-gray-400">
            © {new Date().getFullYear()} FineGuard. All rights reserved. Registered in England and Wales.
          </p>
        </div>
      </footer>
    </div>
  );
}
