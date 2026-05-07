import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight, Bell, FileText, Zap } from 'lucide-react';
import Nav from '@/components/Nav';

export default function FineGuard() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    document.title = 'FineGuard — Compliance Cloud';
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F8F8] pt-14">
      <Nav />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="flex items-center justify-center mb-6">
          <Shield className="w-16 h-16 text-[#C9A64A]" />
        </div>
        <h1 className="text-5xl font-bold text-[#1A1A1A] mb-6">
          FineGuard Compliance Cloud
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Automated Companies House compliance tracking and alerts — so you never miss a deadline or pay a penny in penalties.
        </p>
        <Button
          onClick={() => setLocation('/compliance-bundle')}
          className="bg-[#C9A64A] hover:bg-[#B8954A] text-white px-8 py-6 text-lg"
        >
          Get Compliance Bundle
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </section>

      {/* Features */}
      <section className="bg-[#1A1A1A] py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Everything you need to stay compliant
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <div className="w-12 h-12 bg-[#C9A64A]/20 rounded-xl flex items-center justify-center mb-5">
                <Bell className="w-6 h-6 text-[#C9A64A]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Real-time Monitoring</h3>
              <p className="text-gray-400">
                Live alerts from Companies House the moment filing deadlines approach.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <div className="w-12 h-12 bg-[#C9A64A]/20 rounded-xl flex items-center justify-center mb-5">
                <Zap className="w-6 h-6 text-[#C9A64A]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Penalty Prevention</h3>
              <p className="text-gray-400">
                Automated reminders stop late filing penalties before they happen — from £150 to £1,500+.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <div className="w-12 h-12 bg-[#C9A64A]/20 rounded-xl flex items-center justify-center mb-5">
                <FileText className="w-6 h-6 text-[#C9A64A]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Instant Reports</h3>
              <p className="text-gray-400">
                Full compliance bundle for any UK company in seconds, powered by Companies House API.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-[#1A1A1A] text-center mb-12">
            How it works
          </h2>
          <div className="flex flex-col gap-8">
            {[
              { step: 1, text: 'Enter your company number' },
              { step: 2, text: 'We fetch live data from Companies House' },
              { step: 3, text: 'Get your compliance status instantly' },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-center gap-6">
                <div className="w-12 h-12 shrink-0 rounded-full bg-[#C9A64A] flex items-center justify-center text-white font-bold text-lg">
                  {step}
                </div>
                <p className="text-lg text-[#1A1A1A] font-medium">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-[#C9A64A] py-16 text-center">
        <h2 className="text-3xl font-bold text-white mb-3">
          Start for £3/month — cancel anytime
        </h2>
        <p className="text-white/80 mb-8 text-lg">
          Join hundreds of UK companies staying penalty-free with FineGuard.
        </p>
        <Button
          onClick={() => setLocation('/compliance-bundle')}
          className="bg-[#1A1A1A] hover:bg-black text-white px-8 py-6 text-lg"
        >
          Get Compliance Bundle
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </section>
    </div>
  );
}
