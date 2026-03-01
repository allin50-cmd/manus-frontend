import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  ArrowRight,
  ChevronRight,
  X,
  Menu,
  Zap,
  Lock,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

const FineGuard = () => {
  const [variant, setVariant] = useState<'A' | 'B'>('A'); // 'A' (Control) or 'B' (Urgent)
  const [showIntake, setShowIntake] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [submittedPayload, setSubmittedPayload] = useState<Record<string, unknown> | null>(null);
  const [formData, setFormData] = useState({
    firmName: '',
    email: '',
    clientCount: '',
    services: [] as string[]
  });

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

  const toggleService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStep(3); // Loading/Processing

    // Simulate Power Automate POST
    const payload = {
      ...formData,
      source: `FineGuard Landing - Variant ${variant}`,
      timestamp: new Date().toISOString()
    };

    console.log("POSTING JSON TO POWER AUTOMATE:", payload);
    setSubmittedPayload(payload);

    // Artificial delay to simulate provisioning
    setTimeout(() => {
      setFormStep(4); // Success
    }, 2000);
  };

  const copyToClipboard = (text: string) => {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
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
        <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <Menu />
        </button>
      </nav>

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
            <button className="px-8 py-4 rounded-xl text-lg font-semibold border border-gray-300 hover:bg-white transition-all">
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
          <div className="aspect-[4/3] bg-gray-200 rounded-2xl overflow-hidden shadow-2xl relative">
            {/* Hero Placeholder/Video */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300">
               <div className="text-center">
                  <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Shield className="w-8 h-8 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-400 uppercase tracking-widest">Dashboard Preview</span>
               </div>
            </div>

            {/* Floating Card */}
            <div
              className="absolute bottom-6 right-6 bg-white p-4 rounded-xl shadow-2xl border border-gray-100 w-[240px] md:w-[260px]"
              style={{ animation: 'float 4s ease-in-out infinite' }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Live Alert</span>
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              </div>
              <p className="text-xs font-semibold mb-1">VAT Return: ABC Ltd</p>
              <p className="text-[10px] text-gray-500">Deadline: 07 July (3 days left)</p>
              <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[85%]"></div>
              </div>
            </div>
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

          <div className="relative rounded-t-3xl border-t border-x border-gray-800 bg-gray-900 aspect-video shadow-2xl overflow-hidden">
             {/* Dashboard Mockup */}
             <div className="p-8 h-full">
                <div className="flex gap-4 mb-8">
                  <div className="w-1/4 h-32 bg-gray-800 rounded-xl animate-pulse"></div>
                  <div className="w-1/4 h-32 bg-gray-800 rounded-xl animate-pulse"></div>
                  <div className="w-1/4 h-32 bg-gray-800 rounded-xl animate-pulse"></div>
                  <div className="w-1/4 h-32 bg-gray-800 rounded-xl animate-pulse"></div>
                </div>
                <div className="w-full h-full bg-gray-800 rounded-xl animate-pulse"></div>
             </div>

             {/* Center Overlay Caption */}
             <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-full flex items-center gap-3">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
               <span className="text-sm font-medium">Monitoring 412 active filings across 82 clients</span>
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

      {/* Footer */}
      <footer className="py-12 border-t border-gray-200 text-gray-400 text-sm">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-gray-900">
            <Shield className="w-5 h-5" />
            FineGuard
          </div>
          <p>© 2024 FineGuard Technologies Ltd. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-black">Privacy</a>
            <a href="#" className="hover:text-black">Terms</a>
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
              <h2 className="text-xl font-bold">Practice Intake</h2>
              <button onClick={() => {setShowIntake(false); setFormStep(1)}} className="p-2 hover:bg-gray-100 rounded-full">
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
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
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
                    onClick={() => setFormStep(2)}
                    className="w-full py-4 bg-black text-white rounded-xl font-bold disabled:opacity-30 transition-all"
                  >
                    Next: Configure Services
                  </button>
                </div>
              )}

              {formStep === 2 && (
                <div className="space-y-6">
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
                <div className="py-12 text-center space-y-6 animate-in slide-in-from-bottom duration-300">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold">System Provisioned</h3>
                  <p className="text-gray-600 max-w-sm mx-auto">
                    Your monitoring system is being set up. Check your email (<strong>{formData.email}</strong>) for your unique TenantId and dashboard access.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-left overflow-hidden">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">JSON Payload Debug (Simulation)</p>
                    <pre className="text-[10px] font-mono whitespace-pre-wrap">
                      {JSON.stringify(submittedPayload, null, 2)}
                    </pre>
                  </div>
                  <button
                    onClick={() => {setShowIntake(false); setFormStep(1)}}
                    className="w-full py-4 bg-black text-white rounded-xl font-bold"
                  >
                    Finish
                  </button>
                </div>
              )}
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
