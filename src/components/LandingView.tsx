import { useState } from 'react';
import { AlertCircle, Users, Briefcase, Shield, ArrowRight, Star, BarChart3, Bell, FileText, Zap, Mail, CheckCircle } from 'lucide-react';

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

interface LandingViewProps {
  onEnterVault?: () => void;
  onBookDemo: (email?: string) => void;
  onStartMonitoring: () => void;
  /** Open signup modal with email pre-filled */
  onStartWithEmail?: (email: string) => void;
  /** Open signup modal with intent + optional plan pre-selected */
  onStartWithIntent?: (intent: string, plan?: string) => void;
  hologram?: string;
}

export default function LandingView({ onBookDemo, onStartMonitoring, onStartWithEmail, onStartWithIntent }: LandingViewProps) {
  const [heroEmail, setHeroEmail] = useState('');
  const [ctaEmail, setCtaEmail] = useState('');

  const handleHeroEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroEmail.trim() && onStartWithEmail) {
      onStartWithEmail(heroEmail.trim());
    } else {
      onStartMonitoring();
    }
  };

  const handleCtaEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ctaEmail.trim() && onStartWithEmail) {
      onStartWithEmail(ctaEmail.trim());
    } else {
      onStartMonitoring();
    }
  };

  return (
    <div className="space-y-32 py-12">
      {/* Hero Section */}
      <section className="text-center py-20 animate-in fade-in duration-1000">
        <div className="relative w-64 h-64 mx-auto mb-12">
          <div className="absolute inset-0 bg-[#5A4BFF]/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-[#5A4BFF] to-blue-600 rounded-full opacity-20"></div>
          <div className="relative w-full h-full flex items-center justify-center">
            <Shield size={80} className="text-[#5A4BFF]" />
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-[#5A4BFF]/20 rounded-full animate-ping"></div>
        </div>
        <h1 className="text-7xl md:text-8xl font-black text-white tracking-tighter leading-none mb-8 drop-shadow-[0_0_60px_rgba(255,255,255,0.15)]">
          Never Miss a <br /><span className="text-[#5A4BFF] italic">Compliance Deadline</span> Again
        </h1>
        <p className="text-2xl text-slate-400 max-w-3xl mx-auto mb-10 font-medium leading-relaxed opacity-90">
          FineGuard automatically monitors Companies House records and alerts you before compliance problems damage your business or your clients.
        </p>

        {/* Inline email capture */}
        <form onSubmit={handleHeroEmailSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-lg mx-auto mb-6">
          <div className="relative flex-1 w-full">
            {isValidEmail(heroEmail) ? (
              <CheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400 transition-colors" />
            ) : (
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 transition-colors" />
            )}
            <input
              type="email"
              value={heroEmail}
              onChange={(e) => setHeroEmail(e.target.value)}
              placeholder="Enter your work email"
              className={`w-full pl-12 pr-4 py-5 rounded-full bg-white/5 border-2 text-white placeholder:text-slate-500 text-lg focus:outline-none focus:ring-2 transition-all ${
                isValidEmail(heroEmail)
                  ? 'border-green-500/50 focus:border-green-500/70 focus:ring-green-500/20'
                  : heroEmail.length > 3
                  ? 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20'
                  : 'border-white/10 focus:border-[#5A4BFF]/60 focus:ring-[#5A4BFF]/20'
              }`}
            />
          </div>
          <button
            type="submit"
            disabled={heroEmail.length > 0 && !isValidEmail(heroEmail)}
            className="bg-[#5A4BFF] text-white px-10 py-5 rounded-full font-black text-lg shadow-[0_0_40px_rgba(90,75,255,0.5)] hover:scale-105 transition-all flex items-center gap-3 uppercase tracking-wide whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none"
          >
            Start Free <ArrowRight size={22} />
          </button>
        </form>

        <div className="flex flex-wrap justify-center gap-6 mb-6">
          <button
            onClick={() => onBookDemo(isValidEmail(heroEmail) ? heroEmail : undefined)}
            className="bg-white/10 border-2 border-white/20 text-white px-12 py-5 rounded-[3rem] font-black text-lg hover:bg-white/20 transition-all flex items-center gap-4 uppercase tracking-wide"
          >
            Book a Demo
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6">
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">
            No credit card required. Free plan available.
          </p>
          <a
            href="#pricing"
            onClick={(e) => { e.preventDefault(); document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="text-slate-500 text-sm font-bold uppercase tracking-widest hover:text-[#5A4BFF] transition-colors flex items-center gap-1"
          >
            See pricing ↓
          </a>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '5,000+', label: 'Companies Monitored' },
            { value: '99.7%', label: 'Uptime' },
            { value: '250+', label: 'Accountancy Firms' },
            { value: '< 1min', label: 'Alert Response' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="text-3xl font-black text-[#5A4BFF]">{stat.value}</div>
              <div className="text-sm text-slate-400 mt-1 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Problem Section */}
      <section className="max-w-5xl mx-auto px-6 py-20 bg-white/5 rounded-[4rem] border border-white/10 backdrop-blur-sm">
        <h2 className="text-5xl md:text-6xl font-black text-white text-center mb-16 leading-tight">
          Compliance mistakes happen quietly — <span className="text-[#5A4BFF]">until it's too late.</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="text-red-400 flex-shrink-0 mt-1" size={28} />
              <p className="text-xl text-slate-300">Missed confirmation statements</p>
            </div>
            <div className="flex items-start gap-4">
              <AlertCircle className="text-red-400 flex-shrink-0 mt-1" size={28} />
              <p className="text-xl text-slate-300">Director or PSC changes unnoticed</p>
            </div>
            <div className="flex items-start gap-4">
              <AlertCircle className="text-red-400 flex-shrink-0 mt-1" size={28} />
              <p className="text-xl text-slate-300">Registered address updates ignored</p>
            </div>
          </div>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="text-red-400 flex-shrink-0 mt-1" size={28} />
              <p className="text-xl text-slate-300">Filing deadlines slipping</p>
            </div>
            <div className="flex items-start gap-4">
              <AlertCircle className="text-red-400 flex-shrink-0 mt-1" size={28} />
              <p className="text-xl text-slate-300">Unexpected company strike-offs</p>
            </div>
            <div className="flex items-start gap-4">
              <AlertCircle className="text-red-400 flex-shrink-0 mt-1" size={28} />
              <p className="text-xl text-slate-300">Manual tracking overload</p>
            </div>
          </div>
        </div>
        <p className="text-center text-slate-400 text-xl mt-16 max-w-2xl mx-auto">
          Manual monitoring fails. Clients get fined or dissolved. Trust is lost.
        </p>
      </section>

      {/* Solution Section */}
      <section id="features" className="text-center py-20">
        <h2 className="text-5xl md:text-6xl font-black text-white mb-8 leading-tight">
          Compliance protection, <span className="text-[#5A4BFF]">automated.</span>
        </h2>
        <p className="text-2xl text-slate-300 max-w-3xl mx-auto mb-16">
          FineGuard continuously monitors company records so nothing slips through the cracks.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            { icon: BarChart3, text: 'Automatic Companies House monitoring' },
            { icon: Bell, text: 'Deadline and filing alerts' },
            { icon: Users, text: 'Director & PSC change tracking' },
            { icon: FileText, text: 'Portfolio monitoring for accountants' },
            { icon: Zap, text: 'Real-time compliance warnings' },
            { icon: Shield, text: 'Runs quietly in the background' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="bg-white/5 p-8 rounded-3xl border border-white/10 flex items-center gap-4 text-left hover:border-[#5A4BFF]/30 transition-colors">
              <Icon className="text-[#5A4BFF] flex-shrink-0" size={32} />
              <span className="text-xl font-medium text-slate-200">{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Microsoft 365 Integration Section */}
      <section className="text-center py-20 bg-white/5 rounded-[4rem] border border-white/10 backdrop-blur-sm px-6">
        <h2 className="text-5xl md:text-6xl font-black text-white mb-8 leading-tight">
          Integrated into <span className="text-[#5A4BFF]">Microsoft 365.</span>
        </h2>
        <p className="text-2xl text-slate-300 max-w-3xl mx-auto mb-16">
          FineGuard connects directly with Teams, Outlook, and Power Automate — no context switching needed.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
          {[
            {
              icon: Users,
              title: 'Teams Chat & Notifications',
              desc: 'Get compliance alerts and risk summaries directly in Teams without leaving your workspace.',
            },
            {
              icon: Mail,
              title: 'Outlook Reminders',
              desc: 'Deadline reminders and alerts delivered straight to your inbox with calendar integration.',
            },
            {
              icon: Zap,
              title: 'Power Automate Flows',
              desc: 'Trigger custom workflows and integrations with your existing Microsoft cloud services.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
              <Icon className="w-12 h-12 text-[#5A4BFF] mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
              <p className="text-slate-400 text-sm">{desc}</p>
            </div>
          ))}
        </div>
        <p className="text-slate-500 text-sm">
          M365 integration is optional. FineGuard works perfectly as a standalone app.
        </p>
      </section>

      {/* Dashboard Preview */}
      <section className="max-w-5xl mx-auto py-20">
        <h2 className="text-5xl md:text-6xl font-black text-white text-center mb-8 leading-tight">
          See risks before they <span className="text-[#5A4BFF]">become problems.</span>
        </h2>
        <p className="text-2xl text-slate-300 text-center mb-16">
          FineGuard gives you a clear view of company compliance across your portfolio.
        </p>
        <div className="bg-gradient-to-br from-[#5A4BFF]/10 to-indigo-900/20 p-12 rounded-[4rem] border border-[#5A4BFF]/20">
          <div className="grid grid-cols-3 gap-6 text-center text-white">
            <div className="bg-white/5 p-6 rounded-3xl">
              <div className="text-4xl font-black text-green-400">12</div>
              <div className="text-sm uppercase tracking-wider mt-2 text-slate-400">Secure Companies</div>
            </div>
            <div className="bg-white/5 p-6 rounded-3xl">
              <div className="text-4xl font-black text-yellow-400">3</div>
              <div className="text-sm uppercase tracking-wider mt-2 text-slate-400">Upcoming Deadlines</div>
            </div>
            <div className="bg-white/5 p-6 rounded-3xl">
              <div className="text-4xl font-black text-red-400">1</div>
              <div className="text-sm uppercase tracking-wider mt-2 text-slate-400">Active Alert</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 max-w-6xl mx-auto px-6">
        <h2 className="text-5xl font-black text-white text-center mb-16">
          Trusted by <span className="text-[#5A4BFF]">professionals.</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              quote: "FineGuard saved us from a client's missed confirmation statement. The alert came 14 days early — we filed in time.",
              name: 'Sarah M.',
              role: 'Practice Manager, London Accountancy Firm',
            },
            {
              quote: "We manage 200+ companies. Before FineGuard, tracking deadlines was a nightmare. Now it's automated and reliable.",
              name: 'James P.',
              role: 'ACSP Director',
            },
            {
              quote: "Simple to set up, and the compliance dashboard gives me peace of mind. No more spreadsheets.",
              name: 'Rachel K.',
              role: 'Company Director, SME',
            },
          ].map((t) => (
            <div key={t.name} className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={16} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-slate-300 text-lg mb-6 italic">"{t.quote}"</p>
              <div>
                <div className="text-white font-bold">{t.name}</div>
                <div className="text-slate-500 text-sm">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20">
        <h2 className="text-5xl md:text-6xl font-black text-white text-center mb-16">
          Built for <span className="text-[#5A4BFF]">businesses and advisors.</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10 text-center flex flex-col">
            <Users size={64} className="mx-auto mb-6 text-[#5A4BFF]" />
            <h3 className="text-2xl font-black mb-4">Accountants & Advisors</h3>
            <p className="text-slate-400 flex-1">Protect your entire client base while reducing admin workload.</p>
            <button
              onClick={() => onStartWithIntent ? onStartWithIntent('accountant') : onStartMonitoring()}
              className="mt-6 w-full py-3 rounded-full bg-[#5A4BFF]/15 border border-[#5A4BFF]/30 text-[#5A4BFF] font-bold text-sm hover:bg-[#5A4BFF]/25 transition-colors flex items-center justify-center gap-2"
            >
              Get Started <ArrowRight size={16} />
            </button>
          </div>
          <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10 text-center flex flex-col">
            <Briefcase size={64} className="mx-auto mb-6 text-[#5A4BFF]" />
            <h3 className="text-2xl font-black mb-4">Company Formation Agents</h3>
            <p className="text-slate-400 flex-1">Add compliance protection as a new client service.</p>
            <button
              onClick={() => onStartWithIntent ? onStartWithIntent('acsp_provider') : onStartMonitoring()}
              className="mt-6 w-full py-3 rounded-full bg-[#5A4BFF]/15 border border-[#5A4BFF]/30 text-[#5A4BFF] font-bold text-sm hover:bg-[#5A4BFF]/25 transition-colors flex items-center justify-center gap-2"
            >
              Get Started <ArrowRight size={16} />
            </button>
          </div>
          <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10 text-center flex flex-col">
            <Shield size={64} className="mx-auto mb-6 text-[#5A4BFF]" />
            <h3 className="text-2xl font-black mb-4">SMEs & Directors</h3>
            <p className="text-slate-400 flex-1">Stay compliant without chasing paperwork.</p>
            <button
              onClick={() => onStartWithIntent ? onStartWithIntent('business_owner') : onStartMonitoring()}
              className="mt-6 w-full py-3 rounded-full bg-[#5A4BFF]/15 border border-[#5A4BFF]/30 text-[#5A4BFF] font-bold text-sm hover:bg-[#5A4BFF]/25 transition-colors flex items-center justify-center gap-2"
            >
              Get Started <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section id="pricing" className="py-20 max-w-5xl mx-auto px-6">
        <h2 className="text-5xl font-black text-white text-center mb-4">
          Pay only for <span className="text-[#5A4BFF]">what you monitor.</span>
        </h2>
        <p className="text-xl text-slate-400 text-center mb-16">
          Each service is <span className="text-white font-semibold">£1 per month per company</span>. Pick what you need.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { name: 'Companies House', features: ['Annual return deadlines', 'Accounts filing dates', 'Director changes'] },
            { name: 'Corporate Tax', features: ['Corporation tax returns', 'Payment deadlines', 'HMRC compliance'] },
            { name: 'Self Assessment', features: ['Tax return deadlines', 'Payment due dates', 'Quarterly reminders'] },
            { name: 'VAT Returns', features: ['VAT return deadlines', 'Payment schedules', 'MTD compliance'] },
          ].map((service) => (
            <div key={service.name} className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center hover:border-[#5A4BFF]/30 transition-colors">
              <h3 className="text-lg font-bold text-white mb-2">{service.name}</h3>
              <div className="text-3xl font-black text-white mb-1">£1</div>
              <p className="text-xs text-slate-500 mb-4">/month per company</p>
              <ul className="text-slate-400 space-y-1.5 text-sm mb-6 text-left">
                {service.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-[#5A4BFF] mt-0.5">•</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => onStartWithIntent ? onStartWithIntent('', service.name) : onStartMonitoring()}
                className="w-full py-2.5 rounded-full bg-[#5A4BFF] text-white font-bold text-sm hover:bg-[#6B5BFF] transition-colors"
              >
                Add Service
              </button>
            </div>
          ))}
        </div>
        <p className="text-center mt-8">
          <a href="/pricing" className="text-[#5A4BFF] font-medium hover:underline">
            View full pricing details <ArrowRight size={16} className="inline" />
          </a>
        </p>
      </section>

      {/* Final CTA */}
      <section className="text-center py-20 px-6 bg-white/5 rounded-[4rem] border border-white/10">
        <h2 className="text-6xl font-black text-white mb-6">
          Protect companies before <span className="text-[#5A4BFF]">problems start.</span>
        </h2>
        <p className="text-2xl text-slate-300 mb-10">
          Start monitoring today and eliminate compliance surprises.
        </p>

        {/* Inline email capture — mirrors hero */}
        <form onSubmit={handleCtaEmailSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-lg mx-auto mb-6">
          <div className="relative flex-1 w-full">
            {isValidEmail(ctaEmail) ? (
              <CheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400 transition-colors" />
            ) : (
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 transition-colors" />
            )}
            <input
              type="email"
              value={ctaEmail}
              onChange={(e) => setCtaEmail(e.target.value)}
              placeholder="Enter your work email"
              className={`w-full pl-12 pr-4 py-5 rounded-full bg-white/5 border-2 text-white placeholder:text-slate-500 text-lg focus:outline-none focus:ring-2 transition-all ${
                isValidEmail(ctaEmail)
                  ? 'border-green-500/50 focus:border-green-500/70 focus:ring-green-500/20'
                  : ctaEmail.length > 3
                  ? 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20'
                  : 'border-white/10 focus:border-[#5A4BFF]/60 focus:ring-[#5A4BFF]/20'
              }`}
            />
          </div>
          <button
            type="submit"
            disabled={ctaEmail.length > 0 && !isValidEmail(ctaEmail)}
            className="bg-[#5A4BFF] text-white px-10 py-5 rounded-full font-black text-lg shadow-[0_0_40px_rgba(90,75,255,0.5)] hover:scale-105 transition-all flex items-center gap-3 uppercase tracking-wide whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none"
          >
            Get Started Free <ArrowRight size={22} />
          </button>
        </form>

        <button
          onClick={() => onBookDemo(isValidEmail(ctaEmail) ? ctaEmail : undefined)}
          className="text-slate-400 hover:text-white text-sm font-medium underline underline-offset-4 transition-colors"
        >
          Or talk to sales instead
        </button>
        <p className="text-slate-500 text-sm mt-4">No credit card required. Set up in under 2 minutes.</p>
      </section>
    </div>
  );
}
