import React, { useEffect, useState } from 'react';
import { Lock, Cpu, CheckCircle, AlertCircle, Users, Briefcase, Shield, ArrowRight } from 'lucide-react';

interface LandingViewProps {
  onEnterVault: () => void;
  onBookDemo: () => void;
  onStartMonitoring: () => void;
  hologram?: string;
}

export default function LandingView({ onEnterVault, onBookDemo, onStartMonitoring, hologram }: LandingViewProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setImageLoaded(true); // Mock; replace with actual hologram fetch
  }, []);

  return (
    <div className="space-y-32 py-12">
      {/* Hero Section */}
      <section className="text-center py-20 animate-in fade-in duration-1000">
        <div className="relative w-[500px] h-[500px] mx-auto mb-16 group">
          <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          {hologram ? (
            <img
              src={hologram}
              className="w-full h-full object-contain rounded-[4rem] shadow-[0_0_80px_rgba(59,130,246,0.3)] animate-[float_6s_ease-in-out_infinite]"
              alt="Hologram"
              onLoad={() => setImageLoaded(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center border-4 border-dashed border-white/10 rounded-full">
              <Cpu size={100} className="animate-spin text-white/10" />
            </div>
          )}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-blue-400/30 rounded-full animate-ping"></div>
        </div>
        <h1 className="text-7xl md:text-8xl font-black text-white tracking-tighter leading-none mb-8 drop-shadow-[0_0_60px_rgba(255,255,255,0.15)]">
          Never Miss a <br /><span className="text-blue-500 italic">Compliance Deadline</span> Again
        </h1>
        <p className="text-2xl text-slate-400 max-w-3xl mx-auto mb-10 font-medium leading-relaxed opacity-90">
          FineGuard automatically monitors Companies House records and alerts you before compliance problems damage your business or your clients.
        </p>
        <div className="flex flex-wrap justify-center gap-6 mb-6">
          <button
            onClick={onBookDemo}
            className="bg-blue-500 text-navy px-12 py-6 rounded-[3rem] font-black text-lg shadow-[0_0_40px_rgba(59,130,246,0.5)] hover:scale-105 transition-all flex items-center gap-4 uppercase tracking-wide"
          >
            Book a Demo
          </button>
          <button
            onClick={onStartMonitoring}
            className="bg-white/10 border-2 border-white/20 text-white px-12 py-6 rounded-[3rem] font-black text-lg hover:bg-white/20 transition-all flex items-center gap-4 uppercase tracking-wide"
          >
            Start Monitoring <ArrowRight size={24} />
          </button>
        </div>
        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">
          Protect every company you manage. Zero surprises. Zero missed filings.
        </p>
      </section>

      {/* Problem Section */}
      <section className="max-w-5xl mx-auto px-6 py-20 bg-white/5 rounded-[4rem] border border-white/10 backdrop-blur-sm">
        <h2 className="text-5xl md:text-6xl font-black text-white text-center mb-16 leading-tight">
          Compliance mistakes happen quietly — <span className="text-blue-500">until it's too late.</span>
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
          Compliance protection, <span className="text-blue-500">automated.</span>
        </h2>
        <p className="text-2xl text-slate-300 max-w-3xl mx-auto mb-16">
          FineGuard continuously monitors company records so nothing slips through the cracks.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            'Automatic Companies House monitoring',
            'Deadline and filing alerts',
            'Director & PSC change tracking',
            'Portfolio monitoring for accountants',
            'Real-time compliance warnings',
            'Runs quietly in the background'
          ].map((benefit, i) => (
            <div key={i} className="bg-white/5 p-8 rounded-3xl border border-white/10 flex items-center gap-4 text-left">
              <CheckCircle className="text-green-400 flex-shrink-0" size={32} />
              <span className="text-xl font-medium text-slate-200">{benefit}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Dashboard Section */}
      <section className="max-w-5xl mx-auto py-20">
        <h2 className="text-5xl md:text-6xl font-black text-white text-center mb-8 leading-tight">
          See risks before they <span className="text-blue-500">become problems.</span>
        </h2>
        <p className="text-2xl text-slate-300 text-center mb-16">
          FineGuard gives you a clear view of company compliance across your portfolio.
        </p>
        <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 p-12 rounded-[4rem] border border-blue-500/20">
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

      {/* Who It's For */}
      <section className="py-20">
        <h2 className="text-5xl md:text-6xl font-black text-white text-center mb-16">
          Built for <span className="text-blue-500">businesses and advisors.</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10 text-center">
            <Users size={64} className="mx-auto mb-6 text-blue-400" />
            <h3 className="text-2xl font-black mb-4">Accountants & Advisors</h3>
            <p className="text-slate-400">Protect your entire client base while reducing admin workload.</p>
          </div>
          <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10 text-center">
            <Briefcase size={64} className="mx-auto mb-6 text-blue-400" />
            <h3 className="text-2xl font-black mb-4">Company Formation Agents</h3>
            <p className="text-slate-400">Add compliance protection as a new client service.</p>
          </div>
          <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10 text-center">
            <Shield size={64} className="mx-auto mb-6 text-blue-400" />
            <h3 className="text-2xl font-black mb-4">SMEs & Directors</h3>
            <p className="text-slate-400">Stay compliant without chasing paperwork.</p>
          </div>
        </div>
      </section>

      {/* Partner Section */}
      <section className="max-w-4xl mx-auto text-center py-20 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-[4rem] border border-blue-500/20">
        <h2 className="text-5xl font-black text-white mb-6">
          Turn compliance protection into <span className="text-blue-300">recurring revenue.</span>
        </h2>
        <p className="text-2xl text-slate-300 mb-10 max-w-2xl mx-auto">
          FineGuard partners can offer compliance monitoring to clients, reduce risk, and create new monthly revenue streams.
        </p>
        <button
          onClick={() => {}} // TODO: handle partner signup
          className="bg-blue-500 text-navy px-12 py-6 rounded-[3rem] font-black text-lg shadow-[0_0_40px_rgba(59,130,246,0.5)] hover:scale-105 transition-all inline-flex items-center gap-4"
        >
          Become a Partner
        </button>
      </section>

      {/* Trust Section */}
      <section className="text-center py-20">
        <h2 className="text-5xl font-black text-white mb-6">
          Built for <span className="text-blue-500">UK companies.</span>
        </h2>
        <p className="text-2xl text-slate-300 max-w-3xl mx-auto">
          FineGuard helps businesses stay compliant with evolving filing and reporting requirements, preventing costly surprises.
        </p>
        <div className="flex justify-center gap-12 mt-16 text-slate-400 text-lg">
          <span>Reliable</span>
          <span>Secure</span>
          <span>Always monitoring</span>
        </div>
      </section>

      {/* Final CTA */}
      <section className="text-center py-20 bg-white/5 rounded-[4rem] border border-white/10">
        <h2 className="text-6xl font-black text-white mb-6">
          Protect companies before <span className="text-blue-500">problems start.</span>
        </h2>
        <p className="text-2xl text-slate-300 mb-12">
          Start monitoring today and eliminate compliance surprises.
        </p>
        <div className="flex flex-wrap justify-center gap-6">
          <button
            onClick={onBookDemo}
            className="bg-blue-500 text-navy px-12 py-6 rounded-[3rem] font-black text-lg shadow-[0_0_40px_rgba(59,130,246,0.5)] hover:scale-105 transition-all"
          >
            Book Demo
          </button>
          <button
            onClick={onStartMonitoring}
            className="bg-white/10 border-2 border-white/20 text-white px-12 py-6 rounded-[3rem] font-black text-lg hover:bg-white/20 transition-all"
          >
            Start Monitoring
          </button>
        </div>
      </section>
    </div>
  );
}
