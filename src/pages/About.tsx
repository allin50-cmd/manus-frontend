import { Link } from 'wouter';
import { Shield, Zap, Lock, Target, Eye, Lock as LockIcon, Globe } from 'lucide-react';

export default function About() {
  return (
    <div className="bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014] min-h-full">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="inline-block rounded-full bg-[#5A4BFF]/20 px-4 py-1.5 text-sm text-[#5A4BFF] ring-1 ring-[#5A4BFF]/30 mb-8">
          Accuracy Developments Ltd
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6 leading-tight">
          Built by operators,<br />for operators
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          We founded Accuracy Developments Ltd to bring AI-grade automation to UK professional services compliance — making enterprise-level tooling accessible to every solicitor, director, and barristers&rsquo; chambers in the country.
        </p>
      </section>

      {/* Mission */}
      <section className="border-y border-white/10 bg-white/5 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-4">Our mission</h2>
          <p className="text-gray-400 text-center max-w-xl mx-auto mb-12">
            Three pillars underpin everything we build.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Target className="w-6 h-6 text-[#C9A64A]" />,
                bg: 'bg-[#C9A64A]/10',
                title: 'Accuracy',
                body:
                  'We pull data directly from authoritative sources — Companies House, court records, and official registers — so you can trust every alert and report we produce.',
              },
              {
                icon: <Zap className="w-6 h-6 text-[#5A4BFF]" />,
                bg: 'bg-[#5A4BFF]/10',
                title: 'Intelligence',
                body:
                  'Our AI doesn’t just surface data — it acts. From classifying a new client matter to alerting you before a filing deadline, our systems move so you don’t have to.',
              },
              {
                icon: <Globe className="w-6 h-6 text-cyan-400" />,
                bg: 'bg-cyan-400/10',
                title: 'Accessibility',
                body:
                  'Enterprise compliance tools have long been the preserve of Magic Circle firms. We’re changing that — enterprise-grade software at prices that work for SME legal practices.',
              },
            ].map((pillar) => (
              <div key={pillar.title} className="bg-[#13151C] border border-[#2A2D3A] rounded-xl p-8">
                <div className={`w-12 h-12 rounded-xl ${pillar.bg} flex items-center justify-center mb-6`}>
                  {pillar.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{pillar.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{pillar.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-4">Three products, one platform</h2>
        <p className="text-gray-400 text-center max-w-xl mx-auto mb-12">
          Each product solves a distinct problem for UK legal and compliance professionals.
        </p>
        <div className="space-y-6">
          {[
            {
              icon: <Shield className="w-6 h-6 text-[#C9A64A]" />,
              bg: 'bg-[#C9A64A]/10',
              name: 'FineGuard',
              href: '/fineguard',
              desc: 'Automated Companies House compliance monitoring. FineGuard watches your filing deadlines, tracks director appointments, and alerts you before penalties accrue — so you can focus on running your business rather than reading government notices.',
              accent: 'text-[#C9A64A]',
            },
            {
              icon: <Lock className="w-6 h-6 text-[#5A4BFF]" />,
              bg: 'bg-[#5A4BFF]/10',
              name: 'VaultLine',
              href: '/vaultline',
              desc: 'Legal-grade secure document storage built for law firms. End-to-end encrypted, matter-organised, and fully audited — VaultLine replaces insecure email attachments and consumer cloud storage with a purpose-built solution for UK legal practice.',
              accent: 'text-[#5A4BFF]',
            },
            {
              icon: <Zap className="w-6 h-6 text-cyan-400" />,
              bg: 'bg-cyan-400/10',
              name: 'UltAi',
              href: '/ultai',
              desc: 'AI-powered client intake for law chambers. UltAi classifies incoming enquiries, identifies unbilled time, and routes matters to the right barrister — helping chambers recover revenue and reduce the administrative burden of intake processing.',
              accent: 'text-cyan-400',
            },
          ].map((product) => (
            <div
              key={product.name}
              className="bg-[#13151C] border border-[#2A2D3A] rounded-xl p-8 flex flex-col sm:flex-row gap-6"
            >
              <div className={`w-14 h-14 rounded-xl ${product.bg} flex items-center justify-center flex-shrink-0`}>
                {product.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">{product.desc}</p>
                <Link href={product.href} className={`text-sm font-medium ${product.accent} hover:underline`}>
                  Learn more &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-white/10 bg-white/5 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Our values</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Eye className="w-5 h-5 text-[#5A4BFF]" />,
                title: 'Transparency',
                body: 'We show our working. Every alert includes its source, every calculation is explained.',
              },
              {
                icon: <Shield className="w-5 h-5 text-[#C9A64A]" />,
                title: 'Reliability',
                body: 'Compliance is time-sensitive. We build for uptime, test for edge cases, and monitor continuously.',
              },
              {
                icon: <LockIcon className="w-5 h-5 text-cyan-400" />,
                title: 'Privacy-first',
                body: 'GDPR-compliant by design. No tracking cookies. Minimal data collection. Your data stays yours.',
              },
              {
                icon: <Globe className="w-5 h-5 text-green-400" />,
                title: 'UK-focused',
                body: 'Built specifically for UK law, UK companies, and UK regulatory requirements — not adapted from US tooling.',
              },
            ].map((value) => (
              <div key={value.title} className="bg-[#13151C] border border-[#2A2D3A] rounded-xl p-6">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-4">
                  {value.icon}
                </div>
                <h3 className="text-base font-bold text-white mb-2">{value.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{value.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Want to learn more?</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Book a call with the team or drop us a message — we respond within 24 hours.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/contact"
            className="px-8 py-3 bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white font-semibold rounded-lg transition-colors"
          >
            Get in touch
          </Link>
          <Link
            href="/team"
            className="px-8 py-3 border border-white/20 hover:border-white/40 text-white font-semibold rounded-lg transition-colors"
          >
            Meet the team
          </Link>
        </div>
      </section>
    </div>
  );
}
