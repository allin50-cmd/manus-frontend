import { useState } from 'react';
import { AlertCircle, Users, Briefcase, Shield, ArrowRight, Star, BarChart3, Bell, FileText, Zap, Mail } from 'lucide-react';

interface LandingViewProps {
  onEnterVault?: () => void;
  onBookDemo: () => void;
  onStartMonitoring: () => void;
  /** Open signup modal with email pre-filled */
  onStartWithEmail?: (email: string) => void;
  hologram?: string;
}

export default function LandingView({ onBookDemo, onStartMonitoring, onStartWithEmail }: LandingViewProps) {
  const [heroEmail, setHeroEmail] = useState('');

  const handleHeroEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroEmail.trim() && onStartWithEmail) {
      onStartWithEmail(heroEmail.trim());
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
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="email"
              value={heroEmail}
              onChange={(e) => setHeroEmail(e.target.value)}
              placeholder="Enter your work email"
              className="w-full pl-12 pr-4 py-5 rounded-full bg-white/5 border-2 border-white/10 text-white placeholder:text-slate-500 text-lg focus:outline-none focus:border-[#5A4BFF]/60 focus:ring-2 focus:ring-[#5A4BFF]/20 transition-all"
            />
          </div>
          <button
            type="submit"
            className="bg-[#5A4BFF] text-white px-10 py-5 rounded-full font-black text-lg shadow-[0_0_40px_rgba(90,75,255,0.5)] hover:scale-105 transition-all flex items-center gap-3 uppercase tracking-wide whitespace-nowrap"
          >
            Start Free <ArrowRight size={22} />
          </button>
        </form>

        <div className="flex flex-wrap justify-center gap-6 mb-6">
          <button
            onClick={onBookDemo}
            className="bg-white/10 border-2 border-white/20 text-white px-12 py-5 rounded-[3rem] font-black text-lg hover:bg-white/20 transition-all flex items-center gap-4 uppercase tracking-wide"
          >
            Book a Demo
          </button>
        </div>
        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">
          No credit card required. Free plan available.
        </p>
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
      <section className="text-center py-20">
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
      <section className="py-20 max-w-6xl mx-auto px-6">
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
          <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10 text-center">
            <Users size={64} className="mx-auto mb-6 text-[#5A4BFF]" />
            <h3 className="text-2xl font-black mb-4">Accountants & Advisors</h3>
            <p className="text-slate-400">Protect your entire client base while reducing admin workload.</p>
          </div>
          <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10 text-center">
            <Briefcase size={64} className="mx-auto mb-6 text-[#5A4BFF]" />
            <h3 className="text-2xl font-black mb-4">Company Formation Agents</h3>
            <p className="text-slate-400">Add compliance protection as a new client service.</p>
          </div>
          <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10 text-center">
            <Shield size={64} className="mx-auto mb-6 text-[#5A4BFF]" />
            <h3 className="text-2xl font-black mb-4">SMEs & Directors</h3>
            <p className="text-slate-400">Stay compliant without chasing paperwork.</p>
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-20 max-w-5xl mx-auto px-6">
        <h2 className="text-5xl font-black text-white text-center mb-4">
          Simple, transparent <span className="text-[#5A4BFF]">pricing.</span>
        </h2>
        <p className="text-xl text-slate-400 text-center mb-16">Start free, upgrade as you grow.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
            <h3 className="text-lg font-bold text-slate-300 uppercase tracking-wider mb-2">Free</h3>
            <div className="text-4xl font-black text-white mb-4">$0<span className="text-lg text-slate-500">/mo</span></div>
            <ul className="text-slate-400 space-y-2 text-sm mb-8">
              <li>Up to 5 companies</li>
              <li>Email alerts</li>
              <li>Basic dashboard</li>
            </ul>
            <button onClick={onStartMonitoring} className="w-full py-3 rounded-full bg-white/10 border border-white/20 text-white font-bold hover:bg-white/20 transition-colors">
              Get Started
            </button>
          </div>
          <div className="bg-[#5A4BFF]/10 border-2 border-[#5A4BFF]/40 rounded-3xl p-8 text-center relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#5A4BFF] text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
              Most Popular
            </div>
            <h3 className="text-lg font-bold text-slate-300 uppercase tracking-wider mb-2">Professional</h3>
            <div className="text-4xl font-black text-white mb-4">$49<span className="text-lg text-slate-500">/mo</span></div>
            <ul className="text-slate-400 space-y-2 text-sm mb-8">
              <li>Unlimited companies</li>
              <li>ACSP client management</li>
              <li>Workflow & team tools</li>
              <li>XLSX bulk import</li>
            </ul>
            <button onClick={onStartMonitoring} className="w-full py-3 rounded-full bg-[#5A4BFF] text-white font-bold hover:bg-[#6B5BFF] transition-colors">
              Start Free Trial
            </button>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
            <h3 className="text-lg font-bold text-slate-300 uppercase tracking-wider mb-2">Enterprise</h3>
            <div className="text-4xl font-black text-white mb-4">Custom</div>
            <ul className="text-slate-400 space-y-2 text-sm mb-8">
              <li>White-label options</li>
              <li>API access</li>
              <li>Dedicated support</li>
              <li>Custom integrations</li>
            </ul>
            <button onClick={onBookDemo} className="w-full py-3 rounded-full bg-white/10 border border-white/20 text-white font-bold hover:bg-white/20 transition-colors">
              Contact Sales
            </button>
          </div>
        </div>
        <p className="text-center mt-8">
          <a href="/pricing" className="text-[#5A4BFF] font-medium hover:underline">
            View full pricing details <ArrowRight size={16} className="inline" />
          </a>
        </p>
      </section>

      {/* Final CTA */}
      <section className="text-center py-20 bg-white/5 rounded-[4rem] border border-white/10">
        <h2 className="text-6xl font-black text-white mb-6">
          Protect companies before <span className="text-[#5A4BFF]">problems start.</span>
        </h2>
        <p className="text-2xl text-slate-300 mb-12">
          Start monitoring today and eliminate compliance surprises.
        </p>
        <div className="flex flex-wrap justify-center gap-6">
          <button
            onClick={onStartMonitoring}
            className="bg-[#5A4BFF] text-white px-12 py-6 rounded-[3rem] font-black text-lg shadow-[0_0_40px_rgba(90,75,255,0.5)] hover:scale-105 transition-all flex items-center gap-4"
          >
            Get Started Free <ArrowRight size={24} />
          </button>
          <button
            onClick={onBookDemo}
            className="bg-white/10 border-2 border-white/20 text-white px-12 py-6 rounded-[3rem] font-black text-lg hover:bg-white/20 transition-all"
          >
            Talk to Sales
          </button>
        </div>
        <p className="text-slate-500 text-sm mt-6">No credit card required. Set up in under 2 minutes.</p>
      </section>
    </div>
  );
}
