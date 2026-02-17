import { Link } from 'wouter';
import {
  Shield, Target, Eye, Heart, CheckCircle, ArrowRight,
  Building2, Scale, Award,
} from 'lucide-react';

const stats = [
  { value: '10,000+', label: 'Companies Monitored' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '<2min', label: 'Alert Response Time' },
  { value: '500+', label: 'Partner Firms' },
];

const values = [
  { icon: Target, title: 'Precision', desc: 'Every alert is accurate, every deadline verified against Companies House records in real time.' },
  { icon: Eye, title: 'Transparency', desc: 'Clear compliance status at a glance. No hidden fees, no surprise charges.' },
  { icon: Heart, title: 'Trust', desc: 'Your data is encrypted at rest and in transit. We never share client information with third parties.' },
  { icon: Scale, title: 'Compliance-First', desc: 'We built FineGuard because UK businesses deserve better than spreadsheets and calendar reminders.' },
];

const timeline = [
  { year: '2022', title: 'Founded', desc: 'Born from frustration with manual compliance tracking at a London accountancy practice.' },
  { year: '2023', title: 'Launch', desc: 'FineGuard Pro launched with real-time Companies House monitoring and instant alerts.' },
  { year: '2024', title: 'VaultLine Suite', desc: 'Expanded into secure document storage and AI-powered intake with VaultLine and UltAi.' },
  { year: '2025', title: 'Scale', desc: 'Surpassed 10,000 monitored companies and 500+ partner firms across the UK.' },
];

export default function About() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-[#5A4BFF]/10 to-transparent" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#5A4BFF]/10 border border-[#5A4BFF]/20 text-[#5A4BFF] text-sm font-medium mb-8">
              <Building2 className="w-4 h-4" /> About FineGuard
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-tight mb-6">
              Compliance protection <br className="hidden sm:block" />
              <span className="text-[#5A4BFF]">built for the UK</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              We're on a mission to eliminate compliance failures for every UK limited company. FineGuard monitors, alerts, and protects — so you never face an unexpected fine or strike-off.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 border-y border-white/10 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-black text-white mb-1">{s.value}</div>
                <div className="text-sm text-slate-400 uppercase tracking-wider font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-8 text-center">Our Story</h2>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 sm:p-12 space-y-6">
            <p className="text-lg text-slate-300 leading-relaxed">
              FineGuard was born inside a London accountancy practice where the founders watched clients receive penalties for missed filings — penalties that were entirely preventable.
            </p>
            <p className="text-lg text-slate-300 leading-relaxed">
              The problem wasn't negligence. It was information overload. Accountants managing hundreds of companies couldn't track every confirmation statement, annual account, and director change across Companies House manually.
            </p>
            <p className="text-lg text-slate-300 leading-relaxed">
              So we built FineGuard: an automated compliance monitoring platform that connects directly to Companies House, watches every filing deadline, and sends proactive alerts before problems arise.
            </p>
            <p className="text-lg text-[#5A4BFF] font-semibold">
              Today, FineGuard protects thousands of UK companies and saves partner firms hundreds of hours per month in manual compliance checking.
            </p>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-16 text-center">Our Journey</h2>
          <div className="relative">
            <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-0.5 bg-[#5A4BFF]/20 sm:-translate-x-0.5" />
            {timeline.map((t, i) => (
              <div key={t.year} className={`relative flex items-start gap-8 mb-12 ${i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}>
                <div className={`hidden sm:block flex-1 ${i % 2 === 0 ? 'text-right' : 'text-left'}`}>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-2">{t.title}</h3>
                    <p className="text-slate-400">{t.desc}</p>
                  </div>
                </div>
                <div className="relative z-10 flex-shrink-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#5A4BFF] flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-[#5A4BFF]/30">
                    {t.year.slice(2)}
                  </div>
                </div>
                <div className="flex-1 sm:hidden">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="text-xs text-[#5A4BFF] font-bold mb-1">{t.year}</div>
                    <h3 className="text-lg font-bold text-white mb-1">{t.title}</h3>
                    <p className="text-sm text-slate-400">{t.desc}</p>
                  </div>
                </div>
                <div className="hidden sm:block flex-1" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 text-center">Our Values</h2>
          <p className="text-lg text-slate-400 text-center mb-16 max-w-2xl mx-auto">
            Everything we build starts with these principles.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map((v) => (
              <div key={v.title} className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/[0.07] transition-colors">
                <v.icon className="w-10 h-10 text-[#5A4BFF] mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">{v.title}</h3>
                <p className="text-slate-400 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <Award className="w-16 h-16 text-[#5A4BFF] mx-auto mb-6" />
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-6">
            Ready to protect your companies?
          </h2>
          <p className="text-lg text-slate-400 mb-10">
            Join hundreds of firms who trust FineGuard to keep their clients compliant.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="w-full sm:w-auto px-8 py-4 bg-[#5A4BFF] text-white rounded-full font-bold text-lg hover:bg-[#6B5BFF] transition-colors shadow-lg shadow-[#5A4BFF]/25 inline-flex items-center justify-center gap-2">
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/book-demo" className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white rounded-full font-bold text-lg hover:bg-white/15 transition-colors border border-white/20 inline-flex items-center justify-center">
              Book a Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
