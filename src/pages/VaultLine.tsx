import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Shield, ArrowRight, Lock, FileCheck, Users, Activity,
  Zap, Bell, Upload, ShieldCheck,
} from 'lucide-react';
import LandingNav from '@/components/layout/LandingNav';
import LandingFooter from '@/components/layout/LandingFooter';

const FEATURES = [
  { icon: Lock,      title: 'Immutable Storage',       desc: 'WORM-compliant document vault. Once written, records cannot be altered or deleted — guaranteed audit integrity.' },
  { icon: FileCheck, title: 'Compliance Tracking',     desc: 'Automated Companies House and regulatory deadline monitoring with real-time compliance dashboards.' },
  { icon: Users,     title: 'Granular Access Control', desc: 'Role-based permissions with multi-factor authentication, SSO via Azure AD, and session audit trails.' },
  { icon: Activity,  title: 'Full Audit Trail',        desc: 'Every document access, modification, and sharing event is logged with cryptographic hashes for tamper detection.' },
  { icon: Zap,       title: 'API-First Integration',   desc: 'REST and webhook APIs for seamless integration with your existing practice management or ERP systems.' },
  { icon: Bell,      title: 'Real-time Alerts',        desc: 'Instant notifications for filing deadlines, compliance breaches, director changes, and suspicious access patterns.' },
];

const STATS = [
  { value: '50K+',   label: 'Documents Secured' },
  { value: '99.9%',  label: 'Uptime SLA' },
  { value: 'SOC 2',  label: 'Type II Certified' },
  { value: '256-bit', label: 'AES Encryption' },
];

const STEPS = [
  { step: '01', title: 'Upload',   desc: 'Drag-and-drop documents or connect your existing DMS via API. All major formats supported.' },
  { step: '02', title: 'Classify', desc: 'AI automatically tags and classifies documents by type, jurisdiction, and compliance category.' },
  { step: '03', title: 'Protect',  desc: 'Documents are encrypted, WORM-locked, and linked to their compliance timeline with automated reminders.' },
];

export default function VaultLine() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014]">
      <LandingNav theme="dark" />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5A4BFF]/10 border border-[#5A4BFF]/30 text-[#7B6FFF] text-sm font-medium mb-6">
            <Shield className="w-3.5 h-3.5" />
            Enterprise Document Compliance
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight mb-6">
            Your documents,{' '}
            <span className="bg-gradient-to-r from-[#5A4BFF] to-[#9B8FFF] bg-clip-text text-transparent">
              immutably secured
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            VaultLine Cloud provides enterprise-grade WORM-compliant document storage, automated compliance tracking,
            and a full audit trail — built for law firms and regulated businesses.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={() => setLocation('/book-demo')}
              className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white px-8 py-6 text-base"
            >
              Book a Demo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              onClick={() => setLocation('/dashboard')}
              variant="ghost"
              className="border border-white/20 text-gray-300 hover:text-white hover:border-white/40 px-8 py-6 text-base"
            >
              View Dashboard
            </Button>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-8 border-y border-white/10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-bold text-white mb-1">{s.value}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-4">Everything compliance demands</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Built from the ground up to meet the strictest regulatory requirements, so your team can focus on clients.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-[#5A4BFF]/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-[#5A4BFF]/15 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-[#7B6FFF]" />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 border-y border-white/10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-4">How it works</h2>
            <p className="text-gray-400">Three steps from upload to fully protected compliance record.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-[#5A4BFF]/15 border border-[#5A4BFF]/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-[#7B6FFF] font-bold text-sm">{s.step}</span>
                </div>
                <h3 className="font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance badges */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-gray-500 mb-6 uppercase tracking-wider">Compliance &amp; certifications</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {['SOC 2 Type II', 'ISO 27001', 'GDPR Ready', 'UK DPIA Compliant', 'FCA Aligned'].map((cert) => (
              <div
                key={cert}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#5A4BFF]/30 bg-[#5A4BFF]/5 text-sm text-gray-300"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#5A4BFF]" />
                {cert}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-10 rounded-2xl bg-gradient-to-br from-[#5A4BFF]/20 to-[#9B8FFF]/10 border border-[#5A4BFF]/30">
            <Upload className="w-10 h-10 text-[#7B6FFF] mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">Ready to secure your documents?</h2>
            <p className="text-gray-400 mb-8">
              Join hundreds of law firms and regulated businesses who trust VaultLine Cloud for their compliance infrastructure.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={() => setLocation('/book-demo')}
                className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white px-8 py-3"
              >
                Book a Demo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                onClick={() => setLocation('/pricing')}
                variant="ghost"
                className="border border-white/20 text-gray-300 hover:text-white px-8 py-3"
              >
                View Pricing
              </Button>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter theme="dark" />
    </div>
  );
}
