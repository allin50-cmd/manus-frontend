import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  CheckCircle,
  BarChart3,
  ChevronRight,
  ChevronDown,
  X,
  Menu,
  Zap,
  Star,
  TrendingUp,
  Clock,
  AlertTriangle
} from 'lucide-react';

const FineGuard = () => {
  const [variant, setVariant] = useState<'A' | 'B'>('A'); // 'A' (Control) or 'B' (Urgent)
  const [showIntake, setShowIntake] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [submittedPayload, setSubmittedPayload] = useState<Record<string, unknown> | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firmName: '',
    email: '',
    clientCount: '',
    services: [] as string[]
  });

  const [showLegal, setShowLegal] = useState<'privacy' | 'terms' | null>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<{ email?: string }>({});

  // Mobile Sticky CTA visibility logic
  const [showSticky, setShowSticky] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const heroBottom = heroRef.current.getBoundingClientRect().bottom;
        setShowSticky(heroBottom < 0);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ESC closes any open modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (showLegal) { setShowLegal(null); return; }
      if (showIntake) { setShowIntake(false); setFormStep(1); setSubmitError(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showLegal, showIntake]);

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const goToStep2 = () => {
    const err: { email?: string } = {};
    if (!validateEmail(formData.email)) err.email = 'Enter a valid email address';
    if (Object.keys(err).length) { setFormErrors(err); return; }
    setFormErrors({});
    setFormStep(2);
  };

  const toggleService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setFormStep(3); // Loading/Processing

    const payload = {
      ...formData,
      source: `FineGuard Landing - Variant ${variant}`,
      timestamp: new Date().toISOString()
    };

    const webhookUrl = import.meta.env.VITE_POWER_AUTOMATE_URL as string | undefined;

    try {
      if (webhookUrl) {
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json().catch(() => ({}));
        if (json.tenantId) setTenantId(json.tenantId);
      } else {
        // No webhook configured — simulate a short delay + fake tenantId
        await new Promise(resolve => setTimeout(resolve, 1500));
        setTenantId(`FG-${Math.random().toString(36).slice(2, 10).toUpperCase()}`);
      }
      setSubmittedPayload(payload);
      setFormStep(4); // Success
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed');
      setFormStep(2); // Return to service selection so user can retry
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {
      // fallback for non-secure contexts
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    });
  };

  // Theme Constants
  const colors = {
    bg: '#F7F7F7',
    primary: '#1A1A1A',
    secondary: '#6B7280',
    accent: variant === 'A' ? '#3B82F6' : '#EF4444', // Blue for A, Red-ish for B
    border: '#E5E7EB'
  };

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: colors.bg, color: colors.primary }}>

      {/* Variant Toggle (Internal Tooling) */}
      <div className="fixed top-4 right-4 z-50 flex gap-2 p-1 bg-white rounded-full shadow-lg border border-gray-200">
        <button
          onClick={() => setVariant('A')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${variant === 'A' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}
        >
          Variant A (Control)
        </button>
        <button
          onClick={() => setVariant('B')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${variant === 'B' ? 'bg-red-600 text-white' : 'text-gray-500'}`}
        >
          Variant B (Fear)
        </button>
      </div>

      {/* Navigation */}
      <nav className="max-w-[1200px] mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <Shield className="w-8 h-8 text-blue-600" />
          <span>FineGuard</span>
        </div>
        <div className="hidden md:flex gap-8 items-center text-sm font-medium text-gray-500">
          <a href="#how" className="hover:text-black">How it works</a>
          <a href="#pricing" className="hover:text-black">Pricing</a>
          <button
            onClick={() => setShowIntake(true)}
            className="bg-black text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            {variant === 'A' ? 'Start monitoring' : 'Protect your firm'}
          </button>
        </div>
        <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-6 pb-6 space-y-4 shadow-sm">
          <a
            href="#how"
            className="block py-3 text-sm font-medium text-gray-600 hover:text-black border-b border-gray-100"
            onClick={() => setIsMenuOpen(false)}
          >
            How it works
          </a>
          <a
            href="#pricing"
            className="block py-3 text-sm font-medium text-gray-600 hover:text-black border-b border-gray-100"
            onClick={() => setIsMenuOpen(false)}
          >
            Pricing
          </a>
          <button
            onClick={() => { setIsMenuOpen(false); setShowIntake(true); }}
            className="w-full py-3 bg-black text-white rounded-xl font-bold text-sm"
          >
            {variant === 'A' ? 'Start monitoring' : 'Protect your firm'}
          </button>
        </div>
      )}

      {/* Hero Section */}
      <section ref={heroRef} className={`max-w-[1200px] mx-auto px-6 pt-12 pb-20 grid md:grid-cols-12 gap-12 items-center ${variant === 'B' ? 'bg-gray-50' : ''}`}>
        <div className="md:col-span-6 order-2 md:order-1">
          {variant === 'A' ? (
            <>
              <h1 className="text-[32px] md:text-[48px] leading-[1.1] font-semibold mb-6">
                Total control over every client deadline.
              </h1>
              <p className="text-[16px] md:text-[20px] text-gray-600 mb-8 max-w-lg">
                Automated monitoring for VAT, Companies House, and Corporation Tax. Never miss a filing again.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-[32px] md:text-[48px] leading-[1.1] font-semibold mb-6 text-red-700">
                Miss one deadline. Pay the price.
              </h1>
              <p className="text-[16px] md:text-[20px] text-gray-600 mb-8 max-w-lg">
                Fines. Client loss. Reputation damage. All from something you didn't see coming.
              </p>
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setShowIntake(true)}
              className="px-8 py-4 rounded-xl text-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2"
              style={{ backgroundColor: variant === 'B' ? '#dc2626' : '#2563eb' }}
            >
              {variant === 'A' ? 'Start monitoring' : 'Protect your firm now'}
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 rounded-xl text-lg font-semibold border border-gray-300 hover:bg-white transition-all"
            >
              Watch Demo
            </button>
          </div>

          {variant === 'B' && (
            <div className="mt-12 p-6 bg-red-50 border border-red-100 rounded-2xl">
              <h3 className="text-red-800 font-bold mb-4 uppercase tracking-wider text-xs">The Real Cost of Failure</h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-3 text-red-900 font-medium">
                  <span className="w-2 h-2 rounded-full bg-red-600"></span>
                  £150+ late filing penalty
                </div>
                <div className="flex items-center gap-3 text-red-900 font-medium">
                  <span className="w-2 h-2 rounded-full bg-red-600"></span>
                  Client churn & loss of trust
                </div>
                <div className="flex items-center gap-3 text-red-900 font-medium">
                  <span className="w-2 h-2 rounded-full bg-red-600"></span>
                  Regulatory risk & investigations
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-6 relative order-1 md:order-2">
          <div className="aspect-[4/3] bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-200 flex flex-col">
            {/* Mini dashboard header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold">FineGuard Dashboard</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] text-gray-500">Live</span>
              </div>
            </div>
            {/* Stat row */}
            <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
              {[
                { label: 'VAT', count: 23, color: 'text-blue-600' },
                { label: 'Corp Tax', count: 18, color: 'text-purple-600' },
                { label: 'CH', count: 12, color: 'text-green-600' }
              ].map((s, i) => (
                <div key={i} className="px-4 py-3 text-center">
                  <p className={`text-xl font-bold ${s.color}`}>{s.count}</p>
                  <p className="text-[10px] text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
            {/* Client rows */}
            <div className="flex-1 divide-y divide-gray-50 overflow-hidden">
              {[
                { name: 'Meridian Consulting', type: 'VAT Return', days: 3, status: 'urgent' },
                { name: 'Ashford & Sons Ltd', type: 'Corporation Tax', days: 14, status: 'warning' },
                { name: 'Blue Ridge Tech', type: 'Companies House', days: 31, status: 'ok' },
                { name: 'Hartley Retail Group', type: 'VAT Return', days: 47, status: 'ok' }
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{row.name}</p>
                    <p className="text-[10px] text-gray-400">{row.type}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    row.status === 'urgent' ? 'bg-red-100 text-red-700' :
                    row.status === 'warning' ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {row.days}d
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust / Stats Band */}
      <section className="bg-white border-y border-gray-100 py-10">
        <div className="max-w-[1200px] mx-auto px-6">
          <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">Trusted by 200+ UK accounting practices</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '200+', label: 'Practices onboarded', icon: <Shield className="w-5 h-5 text-blue-500" /> },
              { value: '18,400', label: 'Deadlines monitored', icon: <TrendingUp className="w-5 h-5 text-green-500" /> },
              { value: '0', label: 'Missed filings (YTD)', icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
              { value: '60s', label: 'HMRC refresh interval', icon: <Clock className="w-5 h-5 text-blue-500" /> }
            ].map((stat, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-center mb-2">{stat.icon}</div>
                <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reality Split */}
      <section className="bg-white py-24">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-0 border border-gray-200 rounded-3xl overflow-hidden">
            <div className="p-12 bg-gray-50">
              <span className="text-xs font-bold text-gray-400 uppercase mb-4 block">The Old Way</span>
              <h2 className="text-2xl font-semibold mb-6">Manual chaos & spreadsheets</h2>
              <div className="space-y-4 opacity-60 pointer-events-none grayscale">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-white p-4 rounded border border-gray-200 flex justify-between">
                    <div className="w-24 h-3 bg-gray-200 rounded"></div>
                    <div className="w-12 h-3 bg-red-100 rounded"></div>
                  </div>
                ))}
              </div>
              <p className="mt-8 text-gray-500 italic text-sm">"I hope I didn't miss anyone this month..."</p>
            </div>

            <div className="hidden md:block w-px bg-gray-200 self-stretch"></div>

            <div className="p-12 bg-white">
              <span className="text-xs font-bold text-blue-600 uppercase mb-4 block">The FineGuard Way</span>
              <h2 className="text-2xl font-semibold mb-6">Automated precision</h2>
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-blue-50 p-4 rounded border border-blue-100 flex justify-between items-center">
                    <div className="w-32 h-3 bg-blue-200 rounded"></div>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                ))}
              </div>
              <p className="mt-8 text-blue-600 font-medium text-sm">Every client monitored, 24/7.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-24 max-w-[1200px] mx-auto px-6">
        <h2 className="text-3xl font-semibold mb-12 text-center">Three steps to safety</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Connect Firm",
              desc: "Link your practice software in minutes with our secure API vault.",
              icon: <Zap className="w-6 h-6 text-blue-600" />
            },
            {
              step: "02",
              title: "Import Clients",
              desc: "FineGuard identifies every VAT, CT, and CH deadline automatically.",
              icon: <BarChart3 className="w-6 h-6 text-blue-600" />
            },
            {
              step: "03",
              title: "Live Monitoring",
              desc: "We track HMRC & Companies House status every 60 seconds.",
              icon: <Shield className="w-6 h-6 text-blue-600" />
            }
          ].map((item, i) => (
            <div key={i} className="p-8 border border-gray-200 rounded-2xl bg-white hover:border-blue-300 transition-colors">
              <div className="mb-6">{item.icon}</div>
              <span className="text-xs font-bold text-gray-400 mb-2 block">{item.step}</span>
              <h3 className="text-xl font-semibold mb-4">{item.title}</h3>
              <p className="text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Control Panel (Full Width Image) */}
      <section className="py-24 bg-black text-white overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold mb-6">The Practice Dashboard</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">One screen. Every client. Zero blind spots.</p>
          </div>

          <div className="relative rounded-t-3xl border-t border-x border-gray-800 bg-gray-900 shadow-2xl overflow-hidden">
            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-4 p-6 pb-0">
              {[
                { label: 'Active Clients', value: '82', sub: '+4 this month', color: 'text-blue-400' },
                { label: 'VAT Filings', value: '247', sub: '3 due this week', color: 'text-purple-400' },
                { label: 'Corp Tax', value: '118', sub: 'All on track', color: 'text-green-400' },
                { label: 'Overdue', value: '0', sub: 'Perfect score', color: 'text-green-400' }
              ].map((card, i) => (
                <div key={i} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{card.label}</p>
                  <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                  <p className="text-[10px] text-gray-500 mt-1">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="p-6">
              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="grid grid-cols-4 px-4 py-2 border-b border-gray-700 text-[10px] text-gray-500 uppercase tracking-wider">
                  <span>Client</span><span>Filing type</span><span>Deadline</span><span>Status</span>
                </div>
                {[
                  { client: 'Meridian Consulting', type: 'VAT Return', deadline: '07 Jul 2025', badge: 'bg-red-900 text-red-300', status: 'Urgent' },
                  { client: 'Ashford & Sons', type: 'Corporation Tax', deadline: '31 Jul 2025', badge: 'bg-amber-900 text-amber-300', status: 'Due soon' },
                  { client: 'Blue Ridge Tech', type: 'Companies House', deadline: '14 Aug 2025', badge: 'bg-green-900 text-green-300', status: 'On track' },
                  { client: 'Hartley Retail', type: 'VAT Return', deadline: '07 Sep 2025', badge: 'bg-green-900 text-green-300', status: 'On track' },
                ].map((row, i) => (
                  <div key={i} className="grid grid-cols-4 px-4 py-3 border-b border-gray-700/50 text-xs hover:bg-gray-750 transition-colors">
                    <span className="text-white font-medium">{row.client}</span>
                    <span className="text-gray-400">{row.type}</span>
                    <span className="text-gray-400">{row.deadline}</span>
                    <span className={`inline-flex items-center self-center px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${row.badge}`}>{row.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom bar */}
            <div className="px-6 pb-6">
              <div className="bg-white/5 backdrop-blur border border-white/10 px-5 py-3 rounded-full flex items-center gap-3 w-fit mx-auto">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Monitoring 412 active filings across 82 clients</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-[400px] mx-auto p-10 bg-white border border-gray-200 rounded-3xl shadow-xl">
          <div className="text-center mb-8">
            <h3 className="text-lg font-bold text-blue-600 uppercase mb-2">Practice Pro</h3>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold">£99</span>
              <span className="text-gray-400">/mo</span>
            </div>
            <p className="text-gray-500 mt-4">Up to 100 monitored clients</p>
          </div>

          <div className="space-y-4 mb-10">
            {['Unlimited VAT checks', 'Companies House direct sync', 'Custom SMS alerts', 'Multi-user access'].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">{item}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowIntake(true)}
            className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg"
          >
            Get Started
          </button>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white border-t border-gray-100">
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="text-3xl font-semibold text-center mb-14">What practices say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "We had a VAT penalty two years ago that cost us a client and £3,000. Since switching to FineGuard we haven't missed a single deadline across 60+ clients.",
                name: "Sarah Okafor",
                firm: "Okafor & Partners, Birmingham",
                rating: 5
              },
              {
                quote: "The 60-second HMRC refresh is a game changer. We used to check manually every morning — now the system just tells us when something needs action.",
                name: "James Whitfield",
                firm: "Whitfield Accounting, Leeds",
                rating: 5
              },
              {
                quote: "Setup took about 10 minutes. Our whole team was using it by the end of the day. The dashboard is the first thing we open every morning.",
                name: "Priya Mehta",
                firm: "Meridian Accountants, London",
                rating: 5
              }
            ].map((t, i) => (
              <div key={i} className="p-8 border border-gray-200 rounded-2xl bg-gray-50 flex flex-col gap-6">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed text-sm flex-1">"{t.quote}"</p>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.firm}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gray-100 border-t border-gray-200">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <h2 className="text-4xl font-semibold mb-8">Ready to automate your safety net?</h2>
          <button
            onClick={() => setShowIntake(true)}
            className="px-12 py-5 bg-blue-600 text-white rounded-xl text-xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-200"
            style={{ backgroundColor: variant === 'B' ? '#dc2626' : '#2563eb' }}
          >
            {variant === 'A' ? 'Start monitoring' : 'Protect your firm now'}
          </button>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-white border-t border-gray-100">
        <div className="max-w-[720px] mx-auto px-6">
          <h2 className="text-3xl font-semibold text-center mb-12">Common questions</h2>
          <div className="space-y-2">
            {[
              {
                q: 'Which filing types does FineGuard monitor?',
                a: 'VAT returns, Corporation Tax (CT600), Companies House confirmation statements and accounts, and Self Assessment deadlines. Coverage expands regularly — see the roadmap in your dashboard.'
              },
              {
                q: 'How does FineGuard connect to HMRC and Companies House?',
                a: 'We use the official HMRC MTD (Making Tax Digital) and Companies House REST APIs, polling every 60 seconds. No screen-scraping; no shared credentials.'
              },
              {
                q: 'What happens if a deadline is about to be missed?',
                a: 'You receive a graded alert sequence: email at 30 days, 14 days, 7 days, 3 days, and 1 day before the deadline, plus optional SMS. Each alert links directly to the relevant filing portal.'
              },
              {
                q: 'Is my client data secure?',
                a: 'Data is processed within the Microsoft Azure UK South region, encrypted at rest (AES-256) and in transit (TLS 1.3). FineGuard holds ISO 27001 certification and is fully GDPR-compliant.'
              },
              {
                q: 'Can I cancel at any time?',
                a: 'Yes. Monthly subscriptions can be cancelled from the billing portal with immediate effect. You retain read-only access to historical data for 90 days after cancellation.'
              }
            ].map((item, i) => (
              <div key={i} className="border border-gray-200 rounded-2xl overflow-hidden">
                <button
                  className="w-full flex justify-between items-center p-6 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                >
                  <span className="font-semibold text-sm pr-4">{item.q}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${faqOpen === i ? 'rotate-180' : ''}`} />
                </button>
                {faqOpen === i && (
                  <div className="px-6 pb-6 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-4">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-200 text-gray-400 text-sm">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-gray-900">
            <Shield className="w-5 h-5" />
            FineGuard
          </div>
          <p>© 2025 FineGuard Technologies Ltd. All rights reserved.</p>
          <div className="flex gap-6">
            <button onClick={() => setShowLegal('privacy')} className="hover:text-black transition-colors">Privacy</button>
            <button onClick={() => setShowLegal('terms')} className="hover:text-black transition-colors">Terms</button>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky CTA */}
      <div
        className={`fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 z-40 md:hidden transition-transform duration-300 ${showSticky ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <button
          onClick={() => setShowIntake(true)}
          className="w-full py-4 rounded-xl font-bold bg-blue-600 text-white shadow-lg"
          style={{ height: '52px', backgroundColor: variant === 'B' ? '#dc2626' : '#2563eb' }}
        >
          {variant === 'A' ? 'Start monitoring' : 'Protect your firm now'}
        </button>
      </div>

      {/* Intake Modal */}
      {showIntake && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">

            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Practice Intake</h2>
                {formStep <= 2 && (
                  <div className="flex items-center gap-2 mt-1.5">
                    {[1, 2].map(s => (
                      <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s <= formStep ? 'bg-blue-600 w-8' : 'bg-gray-200 w-4'}`} />
                    ))}
                    <span className="text-[10px] text-gray-400 font-medium ml-1">Step {formStep} of 2</span>
                  </div>
                )}
              </div>
              <button onClick={() => {setShowIntake(false); setFormStep(1); setSubmitError(null); setFormErrors({});}} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8">
              {formStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Firm Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Miller & Associates"
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.firmName}
                      onChange={(e) => setFormData({...formData, firmName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Contact Email</label>
                    <input
                      type="email"
                      placeholder="you@firm.com"
                      className={`w-full p-4 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.email ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                      value={formData.email}
                      onChange={(e) => { setFormData({...formData, email: e.target.value}); setFormErrors({}); }}
                    />
                    {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Number of Clients</label>
                    <select
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                      value={formData.clientCount}
                      onChange={(e) => setFormData({...formData, clientCount: e.target.value})}
                    >
                      <option value="">Select range...</option>
                      <option value="1-20">1 - 20</option>
                      <option value="21-100">21 - 100</option>
                      <option value="101-500">101 - 500</option>
                      <option value="500+">500+</option>
                    </select>
                  </div>
                  <button
                    disabled={!formData.firmName || !formData.email || !formData.clientCount}
                    onClick={goToStep2}
                    className="w-full py-4 bg-black text-white rounded-xl font-bold disabled:opacity-30 transition-all"
                  >
                    Next: Configure Services
                  </button>
                </div>
              )}

              {formStep === 2 && (
                <div className="space-y-6">
                  {submitError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
                      Submission failed: {submitError}. Please try again.
                    </div>
                  )}
                  <h3 className="font-bold">Which services do you provide?</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {['VAT', 'Companies House', 'Corporation Tax', 'Self Assessment'].map(service => (
                      <button
                        key={service}
                        onClick={() => toggleService(service)}
                        className={`p-4 rounded-xl border transition-all text-left flex justify-between items-center ${
                          formData.services.includes(service)
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-sm font-medium">{service}</span>
                        {formData.services.includes(service) && <CheckCircle className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button onClick={() => setFormStep(1)} className="flex-1 py-4 border border-gray-200 rounded-xl font-bold">Back</button>
                    <button
                      onClick={handleSubmit}
                      className="flex-[2] py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200"
                    >
                      Complete Provisioning
                    </button>
                  </div>
                </div>
              )}

              {formStep === 3 && (
                <div className="py-20 text-center space-y-6">
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <div>
                    <p className="font-bold text-lg">Triggering Power Automate...</p>
                    <p className="text-gray-500 text-sm mt-2">Provisioning your monitoring tenant ID.</p>
                  </div>
                </div>
              )}

              {formStep === 4 && (
                <div className="py-8 text-center space-y-6 animate-in slide-in-from-bottom duration-300">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">System Provisioned</h3>
                    <p className="text-gray-500 text-sm mt-2">
                      Welcome email sent to <strong>{formData.email}</strong>
                    </p>
                  </div>

                  {tenantId && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-left space-y-1">
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Your Tenant ID</p>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-2xl font-mono font-bold text-blue-800 tracking-widest">{tenantId}</p>
                        <button
                          onClick={() => copyToClipboard(tenantId)}
                          className="text-[11px] px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="text-[11px] text-blue-500">Keep this safe — you'll need it to access your dashboard.</p>
                    </div>
                  )}

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Submitted payload</p>
                    <pre className="text-[10px] font-mono text-gray-600 whitespace-pre-wrap overflow-auto max-h-40">
                      {JSON.stringify(submittedPayload, null, 2)}
                    </pre>
                  </div>

                  <button
                    onClick={() => { setShowIntake(false); setFormStep(1); setSubmitError(null); setTenantId(null); }}
                    className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Privacy / Terms Modal */}
      {showLegal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {showLegal === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
              </h2>
              <button onClick={() => setShowLegal(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto max-h-[60vh] space-y-4 text-sm text-gray-600 leading-relaxed">
              {showLegal === 'privacy' ? (
                <>
                  <p><strong className="text-gray-900">Data we collect:</strong> Firm name, contact email, client count, and selected services submitted via this intake form.</p>
                  <p><strong className="text-gray-900">How we use it:</strong> To provision your FineGuard monitoring environment and send you onboarding communications. We do not sell your data.</p>
                  <p><strong className="text-gray-900">Storage:</strong> Data is processed via Microsoft Power Automate and stored within the Microsoft 365 ecosystem (UK region). Retention is 24 months from last activity.</p>
                  <p><strong className="text-gray-900">Your rights:</strong> You may request access, correction, or deletion of your data at any time by emailing <span className="text-blue-600">privacy@fineguard.io</span>.</p>
                  <p><strong className="text-gray-900">Cookies:</strong> This site does not use tracking cookies. No third-party analytics scripts are loaded.</p>
                  <p className="text-xs text-gray-400">Last updated: January 2025</p>
                </>
              ) : (
                <>
                  <p><strong className="text-gray-900">Service:</strong> FineGuard provides automated deadline monitoring for UK accounting firms. The service is provided on a subscription basis and does not constitute legal or tax advice.</p>
                  <p><strong className="text-gray-900">Accuracy:</strong> We source deadline data directly from HMRC and Companies House APIs. While we take care to ensure accuracy, you retain responsibility for all client filing obligations.</p>
                  <p><strong className="text-gray-900">Subscription:</strong> Monthly billing. Cancel at any time. No refunds for partial months.</p>
                  <p><strong className="text-gray-900">Liability:</strong> FineGuard Technologies Ltd is not liable for any penalties or losses arising from missed deadlines, system downtime, or data inaccuracies beyond the value of one month's subscription.</p>
                  <p><strong className="text-gray-900">Governing law:</strong> These terms are governed by the laws of England and Wales.</p>
                  <p className="text-xs text-gray-400">Last updated: January 2025</p>
                </>
              )}
            </div>
            <div className="p-6 border-t border-gray-100">
              <button
                onClick={() => setShowLegal(null)}
                className="w-full py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for animations */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
};

export default FineGuard;
