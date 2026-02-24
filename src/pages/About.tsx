import React from 'react';
import { useLocation } from 'wouter';
import { Building2, Shield, Lightbulb, Heart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LandingNav from '@/components/layout/LandingNav';
import LandingFooter from '@/components/layout/LandingFooter';

const VALUES = [
  {
    icon: Shield,
    title: 'Security First',
    desc: 'We design every feature with security as the starting point, not an afterthought. Encryption, immutability, and access control are built into our architecture at the core.',
  },
  {
    icon: Lightbulb,
    title: 'Continuous Innovation',
    desc: 'We combine the latest AI capabilities with deep domain expertise in legal and regulatory compliance to deliver tools that actually change how professionals work.',
  },
  {
    icon: Heart,
    title: 'Client Trust',
    desc: 'Our clients handle sensitive matters on behalf of their own clients. That trust is sacred. We operate with full transparency — no hidden data processing, no surprises.',
  },
];

const TIMELINE = [
  { year: '2021', event: 'Founded', desc: 'VaultLine Brand Suite incorporated in London with a seed round focused on legal compliance infrastructure.' },
  { year: '2022', event: 'VaultLine Launch', desc: 'VaultLine Cloud enters general availability. First 50 law firms signed within 90 days of launch.' },
  { year: '2023', event: 'UltAi Beta', desc: 'UltAi Secure Intake launched in private beta, integrating Claude AI for automated document analysis and matter creation.' },
  { year: '2024', event: 'FineGuard GA', desc: 'FineGuard Compliance Cloud goes live with real-time Companies House monitoring for corporate law teams and accountancy practices.' },
];

export default function About() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014]">
      <LandingNav theme="dark" />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Building2 className="w-14 h-14 text-[#5A4BFF] mx-auto mb-6" />
          <h1 className="text-5xl font-bold text-white mb-6">
            About VaultLine Brand Suite
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            We build compliance infrastructure for law firms and regulated businesses —
            combining WORM-secure document storage, AI-powered intake, and real-time regulatory monitoring
            into one integrated platform.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 px-4 border-y border-white/10">
        <div className="max-w-3xl mx-auto space-y-6 text-gray-300 leading-relaxed text-lg">
          <p>
            VaultLine Brand Suite was founded by a team of lawyers, technologists, and compliance specialists who
            had spent years watching firms lose thousands of pounds to avoidable Companies House penalties, miss
            critical filing deadlines, and struggle to bring new clients onboard efficiently.
          </p>
          <p>
            We built the products we wished existed. VaultLine Cloud provides the immutable, auditable document
            infrastructure that regulated businesses demand. UltAi transforms the client intake process using the
            latest large language models to extract, classify, and risk-score new matters before a fee earner even
            opens their inbox. FineGuard watches every company in your portfolio around the clock so no deadline
            ever slips through the cracks.
          </p>
          <p>
            Today, VaultLine Brand Suite is trusted by over 300 firms across the UK, from boutique practices to
            multi-office regional solicitors and corporate secretarial providers handling thousands of companies.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-4">Our values</h2>
            <p className="text-gray-400">The principles that guide every product decision we make.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="p-7 rounded-xl bg-white/5 border border-white/10 hover:border-[#5A4BFF]/40 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-[#5A4BFF]/15 flex items-center justify-center mb-5">
                  <v.icon className="w-6 h-6 text-[#7B6FFF]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">{v.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 px-4 border-y border-white/10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-4">Our journey</h2>
            <p className="text-gray-400">From idea to integrated compliance platform in three years.</p>
          </div>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-[#5A4BFF]/60 via-[#5A4BFF]/30 to-transparent" />
            <div className="space-y-8">
              {TIMELINE.map((item) => (
                <div key={item.year} className="flex gap-6 relative">
                  <div className="w-16 shrink-0 flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-[#5A4BFF] border-2 border-[#5A4BFF]/40 relative z-10" />
                    <span className="text-xs text-[#7B6FFF] font-bold mt-1">{item.year}</span>
                  </div>
                  <div className="pb-6">
                    <h3 className="font-semibold text-white mb-1">{item.event}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Want to know more?</h2>
          <p className="text-gray-400 mb-8">
            Get in touch with our team for a personalised walkthrough of the full VaultLine Brand Suite platform.
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
              onClick={() => setLocation('/team')}
              variant="ghost"
              className="border border-white/20 text-gray-300 hover:text-white px-8 py-3"
            >
              Meet the Team
            </Button>
          </div>
        </div>
      </section>

      <LandingFooter theme="dark" />
    </div>
  );
}
