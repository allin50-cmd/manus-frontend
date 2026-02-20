import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Shield, ArrowRight, Lock, Users, BarChart3,
  Key, Eye, CheckCircle, Award, Globe, Zap,
} from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';

const features = [
  {
    icon: Lock,
    title: 'Encrypted Storage',
    desc: 'AES-256 encryption at rest and in transit. Your documents are protected by military-grade cryptography at every layer.',
  },
  {
    icon: Users,
    title: 'Access Control',
    desc: 'Granular role-based permissions. Define exactly who can view, edit, or download each document or folder.',
  },
  {
    icon: Eye,
    title: 'Audit Trail',
    desc: 'Immutable log of every access, download, and modification. Perfect for regulatory inquiries and internal governance.',
  },
  {
    icon: BarChart3,
    title: 'Compliance Reports',
    desc: 'Auto-generate SOC 2, ISO 27001, and GDPR compliance reports from your document activity data.',
  },
  {
    icon: Key,
    title: 'Key Management',
    desc: 'Customer-managed encryption keys with hardware security module (HSM) support. You own your data.',
  },
  {
    icon: Shield,
    title: 'Zero-Knowledge Proof',
    desc: 'Verify document authenticity and integrity without exposing sensitive content. Privacy by design.',
  },
];

const certifications = [
  { label: 'SOC 2 Type II', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  { label: 'ISO 27001', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  { label: 'GDPR Compliant', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
  { label: 'HIPAA Ready', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
];

const testimonials = [
  {
    quote: 'VaultLine cut our document audit prep time by 80%. Everything is searchable, versioned, and traceable.',
    author: 'Sarah Chen',
    role: 'Chief Compliance Officer, Meridian Capital',
  },
  {
    quote: 'The zero-knowledge architecture was the deciding factor. Our legal team can now store privileged documents with confidence.',
    author: "James O'Brien",
    role: 'General Counsel, TechBridge Group',
  },
];

export default function VaultLine() {
  usePageTitle('VaultLine');
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0B14] via-[#111327] to-[#0A0B14]">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#5A4BFF]/10 border border-[#5A4BFF]/20 text-[#5A4BFF] text-sm font-semibold mb-8">
          <Shield className="w-4 h-4" /> Enterprise Document Security
        </div>
        <h1 className="text-5xl sm:text-6xl font-black text-white mb-6 leading-tight">
          Secure Storage for<br />
          <span className="text-[#5A4BFF]">Compliance-Critical</span> Documents
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          VaultLine gives enterprises encrypted, auditable document storage with granular access controls — built from the ground up for regulated industries.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button
            onClick={() => setLocation('/book-demo')}
            className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white px-8 py-6 text-base font-bold rounded-full shadow-lg shadow-[#5A4BFF]/25"
          >
            Book a Demo <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button
            onClick={() => setLocation('/signup')}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-base font-bold rounded-full"
          >
            Start Free Trial
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Everything You Need to Stay Secure</h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">Purpose-built features for compliance, audit, and data governance teams.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-[#5A4BFF]/30 hover:bg-white/8 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#5A4BFF]/10 flex items-center justify-center mb-5">
                <f.icon className="w-6 h-6 text-[#5A4BFF]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Certifications */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Award className="w-6 h-6 text-[#5A4BFF]" />
            <h2 className="text-2xl font-black text-white">Security Certifications</h2>
          </div>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">VaultLine maintains the highest security standards so you never have to worry about compliance.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {certifications.map((c) => (
              <span key={c.label} className={`px-5 py-2.5 rounded-full border text-sm font-bold ${c.color}`}>
                <CheckCircle className="w-4 h-4 inline mr-2 opacity-80" />{c.label}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-8 mt-10 text-center">
            <div>
              <p className="text-3xl font-black text-white">99.99%</p>
              <p className="text-slate-500 text-sm mt-1">Uptime SLA</p>
            </div>
            <div>
              <p className="text-3xl font-black text-white">256-bit</p>
              <p className="text-slate-500 text-sm mt-1">AES Encryption</p>
            </div>
            <div>
              <p className="text-3xl font-black text-white">0</p>
              <p className="text-slate-500 text-sm mt-1">Data Breaches</p>
            </div>
            <div>
              <p className="text-3xl font-black text-white">15+</p>
              <p className="text-slate-500 text-sm mt-1">Countries Served</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <h2 className="text-3xl font-black text-white text-center mb-10">Trusted by Compliance Teams</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t) => (
            <div key={t.author} className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <p className="text-slate-300 text-lg leading-relaxed mb-6">"{t.quote}"</p>
              <div>
                <p className="text-white font-bold text-sm">{t.author}</p>
                <p className="text-slate-500 text-sm">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-24 text-center">
        <div className="bg-gradient-to-br from-[#5A4BFF]/10 to-indigo-600/5 border border-[#5A4BFF]/20 rounded-3xl p-12">
          <Globe className="w-10 h-10 text-[#5A4BFF] mx-auto mb-5" />
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Ready to Secure Your Documents?</h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">Join hundreds of compliance teams using VaultLine to protect sensitive documents and sail through audits.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              onClick={() => setLocation('/book-demo')}
              className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white px-8 py-6 text-base font-bold rounded-full shadow-lg shadow-[#5A4BFF]/25"
            >
              Book a Demo <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              onClick={() => setLocation('/signup')}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-base font-bold rounded-full"
            >
              <Zap className="w-4 h-4 mr-2" /> Start Free Trial
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
