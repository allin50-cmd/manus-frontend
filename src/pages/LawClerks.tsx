import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import LegalNav from '@/components/LegalNav';
import SEO from '@/components/SEO';
import {
  FileText,
  Users,
  Calendar,
  DollarSign,
  MessageSquare,
  Shield,
  ChevronRight,
} from 'lucide-react';

const GOLD = '#C9A64A';

const FEATURES = [
  {
    icon: FileText,
    title: 'Brief Management',
    desc: 'Track every brief from instructions received through to completion with full audit history.',
  },
  {
    icon: Users,
    title: 'Barrister Roster',
    desc: 'Manage your full panel — silks, juniors, and tenants — with specialisms and availability.',
  },
  {
    icon: Calendar,
    title: 'Diary & Court Dates',
    desc: 'Never miss a hearing. Centralised diary synced with brief status and barrister assignments.',
  },
  {
    icon: DollarSign,
    title: 'Fee Negotiation',
    desc: 'Record agreed fees, track outstanding payments, and chase with one click.',
  },
  {
    icon: MessageSquare,
    title: 'AI Clerk Notes',
    desc: 'Automatically draft clerk notes from emails and calls — saving hours every week.',
  },
  {
    icon: Shield,
    title: 'Compliance Ready',
    desc: 'GDPR-compliant data handling with full access logs and secure document storage.',
  },
];

const STATS = [
  { value: '2,400+', label: 'Briefs Managed' },
  { value: '98%', label: 'Fee Recovery Rate' },
  { value: '< 2 min', label: 'Setup' },
  { value: 'GDPR', label: 'Compliant' },
];

const STEPS = [
  {
    num: '01',
    title: 'Add Barristers',
    desc: 'Import your full roster in seconds. Set specialisms, year of call, and status.',
  },
  {
    num: '02',
    title: 'Log Briefs',
    desc: 'Capture brief details, assign barristers, set hearing dates and agreed fees.',
  },
  {
    num: '03',
    title: 'Track Fees',
    desc: 'Monitor fee status end-to-end. Automated reminders until payment is confirmed.',
  },
];

export default function LawClerks() {
  const [, setLocation] = useLocation();

  function scrollToFeatures() {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white font-sans">
      <SEO title="Law Clerks" description="AI-powered chambers management for barristers and clerks. Manage briefs, diary, fees, and barrister roster in one intelligent platform." />
      <LegalNav active="clerks" />

      {/* Hero */}
      <section id="main-content" className="mx-auto max-w-4xl px-6 pt-24 pb-24 text-center">
        <div
          className="mb-5 inline-block rounded-full px-4 py-1 text-xs font-semibold tracking-widest uppercase"
          style={{ backgroundColor: `${GOLD}20`, color: GOLD, border: `1px solid ${GOLD}40` }}
        >
          Chambers Management Software
        </div>
        <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          AI-Powered{' '}
          <span style={{ color: GOLD }}>Chambers</span>{' '}
          Management
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-400">
          From brief to fee — manage barristers, diary, and client matters in one intelligent platform.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button
            onClick={() => setLocation('/clerk-dashboard')}
            className="px-8 py-3 text-base font-semibold"
            style={{ backgroundColor: GOLD, color: '#0B0F1A' }}
          >
            Start Free Trial
          </Button>
          <Button
            variant="outline"
            onClick={scrollToFeatures}
            className="px-8 py-3 text-base font-semibold border-white/20 text-white hover:bg-white/5"
          >
            Watch Demo
          </Button>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-0 sm:grid-cols-4">
          {STATS.map(({ value, label }) => (
            <div key={label} className="border-r border-white/10 px-8 py-8 text-center last:border-r-0">
              <div className="text-3xl font-extrabold" style={{ color: GOLD }}>
                {value}
              </div>
              <div className="mt-1 text-sm text-slate-400">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="mb-4 text-center text-3xl font-bold">Everything your clerks need</h2>
        <p className="mb-14 text-center text-slate-400">
          Purpose-built for barristers' chambers — not adapted from generic software.
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-white/20"
            >
              <div
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${GOLD}20` }}
              >
                <Icon className="h-5 w-5" style={{ color: GOLD }} />
              </div>
              <h3 className="mb-2 font-semibold text-white">{title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <h2 className="mb-4 text-center text-3xl font-bold">How it works</h2>
          <p className="mb-14 text-center text-slate-400">Up and running in under two minutes.</p>
          <div className="grid gap-8 sm:grid-cols-3">
            {STEPS.map(({ num, title, desc }) => (
              <div key={num} className="text-center">
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-xl font-extrabold"
                  style={{ backgroundColor: `${GOLD}20`, color: GOLD, border: `2px solid ${GOLD}50` }}
                >
                  {num}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <div
          className="rounded-2xl px-8 py-14"
          style={{ background: `linear-gradient(135deg, ${GOLD}18 0%, ${GOLD}08 100%)`, border: `1px solid ${GOLD}30` }}
        >
          <h2 className="mb-4 text-3xl font-bold">Ready to modernise your chambers?</h2>
          <p className="mb-8 text-slate-400">
            Join hundreds of clerks already saving time and recovering more fees with Law Clerks.
          </p>
          <Button
            onClick={() => setLocation('/clerk-dashboard')}
            className="px-10 py-3 text-base font-bold"
            style={{ backgroundColor: GOLD, color: '#0B0F1A' }}
          >
            Get Started Free →
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-sm text-slate-600">
        © {new Date().getFullYear()} Law Clerks. All rights reserved.
      </footer>
    </div>
  );
}
