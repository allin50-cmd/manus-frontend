import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { FileText, Users, Shield, Lock, ArrowRight, Scale, CheckCircle } from 'lucide-react';
import LegalNav from '@/components/LegalNav';

interface Stats {
  totalBarristers: number;
  activeBarristers: number;
  totalBriefs: number;
  upcomingHearings: number;
  outstandingFees: number;
}

const products = [
  {
    icon: FileText,
    iconColor: 'text-cyan-400',
    cardBorder: 'border-cyan-500/20',
    name: 'UltAi Client Intake',
    tagline: 'AI-powered matter intake — eliminate paper, reduce admin 94%.',
    features: ['Smart matter classification', 'Automatic conflict checking', 'GDPR-compliant storage', 'Auto-routes to right team'],
    cta: 'Try Intake',
    href: '/intake-sheet',
    large: true,
  },
  {
    icon: Users,
    iconColor: 'text-[#C9A64A]',
    cardBorder: 'border-[#C9A64A]/20',
    name: 'Law Clerks',
    tagline: 'Full chambers management for barristers and clerks.',
    features: ['Brief management & tracking', 'Barrister roster & diary', 'Fee negotiation workflow', 'Court date calendar'],
    cta: 'Open Dashboard',
    href: '/clerk-dashboard',
    large: true,
  },
  {
    icon: Shield,
    iconColor: 'text-emerald-400',
    cardBorder: 'border-emerald-500/20',
    name: 'FineGuard Compliance',
    tagline: 'Automated Companies House monitoring and alerts.',
    features: ['24/7 filing monitoring', 'Instant alert + action plan'],
    cta: 'Get Bundle',
    href: '/compliance-bundle',
    large: false,
  },
  {
    icon: Lock,
    iconColor: 'text-purple-400',
    cardBorder: 'border-purple-500/20',
    name: 'VaultLine Documents',
    tagline: 'Enterprise-grade secure document storage.',
    features: ['End-to-end encryption', 'Full audit trails'],
    cta: 'Book Demo',
    href: '/book-demo',
    large: false,
  },
];

const workflow = [
  {
    step: '01',
    title: 'Client Submits',
    body: 'Client completes a branded UltAi intake form. AI extracts entities, flags conflicts, and classifies the matter in under 30 seconds.',
    color: 'text-cyan-400',
    dot: 'bg-cyan-400',
  },
  {
    step: '02',
    title: 'Clerk Reviews',
    body: 'Submission appears instantly in the Law Clerks Intake Queue. Clerk reviews, assigns a barrister, and converts to a live brief with one click.',
    color: 'text-[#C9A64A]',
    dot: 'bg-[#C9A64A]',
  },
  {
    step: '03',
    title: 'Case Managed End-to-End',
    body: 'Brief tracked through diary, fee negotiation, and court preparation. Documents stored in VaultLine. Compliance checked by FineGuard.',
    color: 'text-emerald-400',
    dot: 'bg-emerald-400',
  },
];

export default function LegalSuite() {
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/clerks/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => null);
  }, []);

  return (
    <div className="min-h-screen bg-[#080A10] text-white">
      <LegalNav active="hub" />

      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-24 text-center">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#C9A64A]/5 via-transparent to-transparent" />
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#C9A64A]/30 bg-[#C9A64A]/10 px-4 py-1.5 text-sm text-[#C9A64A]">
            <Scale className="h-4 w-4" />
            3 Products · 1 Platform
          </div>
          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-6xl">
            The Complete Legal<br />
            <span className="text-[#C9A64A]">Operations Platform</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-400">
            Client intake, chambers management, compliance, and document security — unified in one suite built for modern law practices.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setLocation('/clerk-dashboard')}
              className="rounded-xl bg-[#C9A64A] px-8 py-4 text-base font-semibold text-black hover:bg-[#B8954A] transition-colors"
            >
              Open Dashboard
            </button>
            <button
              onClick={() => setLocation('/audit')}
              className="rounded-xl border border-white/20 px-8 py-4 text-base font-semibold text-white hover:bg-white/5 transition-colors"
            >
              Get Free Audit
            </button>
          </div>
        </div>
      </section>

      {/* Live stats */}
      {stats && (
        <section className="border-y border-white/5 bg-[#0C0E16] px-6 py-8">
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 md:grid-cols-5">
            {[
              { label: 'Barristers', value: stats.totalBarristers },
              { label: 'Active', value: stats.activeBarristers },
              { label: 'Briefs', value: stats.totalBriefs },
              { label: 'Hearings (7d)', value: stats.upcomingHearings },
              { label: 'Outstanding Fees', value: stats.outstandingFees },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-bold text-[#C9A64A]">{value}</div>
                <div className="mt-1 text-xs text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Products */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-3 text-center text-3xl font-bold">Everything Your Practice Needs</h2>
          <p className="mb-12 text-center text-gray-400">Four integrated products, one login.</p>

          {/* Large cards */}
          <div className="mb-6 grid gap-6 md:grid-cols-2">
            {products.filter(p => p.large).map(({ icon: Icon, iconColor, cardBorder, name, tagline, features, cta, href }) => (
              <div
                key={name}
                className={`rounded-2xl border ${cardBorder} bg-[#0F1216] p-8 hover:bg-[#121520] transition-colors`}
              >
                <Icon className={`mb-4 h-10 w-10 ${iconColor}`} />
                <h3 className="mb-2 text-xl font-bold">{name}</h3>
                <p className="mb-6 text-gray-400">{tagline}</p>
                <ul className="mb-8 space-y-2">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle className="h-4 w-4 flex-shrink-0 text-[#C9A64A]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setLocation(href)}
                  className="flex items-center gap-2 text-sm font-semibold text-[#C9A64A] hover:text-[#E0B96A] transition-colors"
                >
                  {cta} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Small cards */}
          <div className="grid gap-6 md:grid-cols-2">
            {products.filter(p => !p.large).map(({ icon: Icon, iconColor, cardBorder, name, tagline, features, cta, href }) => (
              <div
                key={name}
                className={`rounded-2xl border ${cardBorder} bg-[#0F1216] p-6 hover:bg-[#121520] transition-colors`}
              >
                <div className="mb-3 flex items-center gap-3">
                  <Icon className={`h-6 w-6 ${iconColor}`} />
                  <h3 className="font-bold">{name}</h3>
                </div>
                <p className="mb-4 text-sm text-gray-400">{tagline}</p>
                <ul className="mb-4 space-y-1">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-gray-400">
                      <CheckCircle className="h-3 w-3 flex-shrink-0 text-[#C9A64A]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setLocation(href)}
                  className="flex items-center gap-2 text-xs font-semibold text-[#C9A64A] hover:text-[#E0B96A] transition-colors"
                >
                  {cta} <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Unified Workflow */}
      <section className="border-y border-white/5 bg-[#0C0E16] px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-3 text-center text-3xl font-bold">How the Suite Works Together</h2>
          <p className="mb-14 text-center text-gray-400">From first client contact to closed matter — one connected workflow.</p>

          <div className="relative grid gap-8 md:grid-cols-3">
            {/* connector line */}
            <div className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-cyan-500/30 via-[#C9A64A]/40 to-emerald-500/30 md:block" />

            {workflow.map(({ step, title, body, color, dot }) => (
              <div key={step} className="relative rounded-2xl border border-white/5 bg-[#0F1216] p-6">
                <div className={`mb-1 h-3 w-3 rounded-full ${dot}`} />
                <div className={`mb-2 text-xs font-mono font-bold ${color}`}>{step}</div>
                <h3 className="mb-3 font-bold text-white">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="px-6 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-4xl font-bold">Ready to modernise your practice?</h2>
          <p className="mb-8 text-gray-400">Join hundreds of chambers already using the Legal Suite.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setLocation('/audit')}
              className="rounded-xl bg-[#C9A64A] px-8 py-4 font-semibold text-black hover:bg-[#B8954A] transition-colors"
            >
              Start Free Trial
            </button>
            <button
              onClick={() => setLocation('/book-demo')}
              className="rounded-xl border border-white/20 px-8 py-4 font-semibold text-white hover:bg-white/5 transition-colors"
            >
              Talk to Sales
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
