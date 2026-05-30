import { Link } from 'wouter';
import { Shield, Lock, Zap, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014]">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="inline-block rounded-full bg-[#5A4BFF]/20 px-4 py-1.5 text-sm text-[#5A4BFF] ring-1 ring-[#5A4BFF]/30 mb-8">
          AI-powered compliance for UK professionals
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-6 leading-tight">
          Intelligence for UK<br />Professional Services
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          FineGuard · VaultLine · UltAi — one platform, three products, zero compliance gaps.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#products"
            className="px-8 py-3 bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            Explore Products
            <ArrowRight className="w-4 h-4" />
          </a>
          <Link
            href="/audit"
            className="px-8 py-3 border border-white/20 hover:border-white/40 text-white font-semibold rounded-lg transition-colors"
          >
            Start Free Audit
          </Link>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-4">Three products, one platform</h2>
        <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
          Purpose-built for UK law firms, chambers, and compliance-focused businesses.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {/* FineGuard */}
          <div className="bg-[#13151C] border border-[#2A2D3A] rounded-xl p-8 flex flex-col hover:border-[#C9A64A]/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-[#C9A64A]/10 flex items-center justify-center mb-6">
              <Shield className="w-6 h-6 text-[#C9A64A]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">FineGuard</h3>
            <p className="text-gray-400 text-sm mb-6">
              Companies House compliance monitoring with automated alerts and penalty protection for UK directors.
            </p>
            <ul className="space-y-2 mb-8 flex-1">
              {[
                'Automated compliance alerts',
                'Filing deadline tracking',
                'Penalty risk assessment',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C9A64A] mt-1.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/fineguard"
              className="flex items-center gap-2 text-[#C9A64A] text-sm font-medium hover:gap-3 transition-all"
            >
              Learn more <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* VaultLine */}
          <div className="bg-[#13151C] border border-[#2A2D3A] rounded-xl p-8 flex flex-col hover:border-[#5A4BFF]/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-[#5A4BFF]/10 flex items-center justify-center mb-6">
              <Lock className="w-6 h-6 text-[#5A4BFF]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">VaultLine</h3>
            <p className="text-gray-400 text-sm mb-6">
              Secure document storage built for law firms — legal-grade encryption, matter management, audit trails.
            </p>
            <ul className="space-y-2 mb-8 flex-1">
              {[
                'Legal-grade encryption',
                'Matter management',
                'Full audit trail',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5A4BFF] mt-1.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/vaultline"
              className="flex items-center gap-2 text-[#5A4BFF] text-sm font-medium hover:gap-3 transition-all"
            >
              Learn more <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* UltAi */}
          <div className="bg-[#13151C] border border-[#2A2D3A] rounded-xl p-8 flex flex-col hover:border-cyan-400/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-cyan-400/10 flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">UltAi</h3>
            <p className="text-gray-400 text-sm mb-6">
              AI-powered client intake for law chambers — matter classification, revenue recovery, and automation.
            </p>
            <ul className="space-y-2 mb-8 flex-1">
              {[
                'AI client intake automation',
                'Matter classification',
                'Revenue recovery audit',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/ultai"
              className="flex items-center gap-2 text-cyan-400 text-sm font-medium hover:gap-3 transition-all"
            >
              Learn more <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-y border-white/10 bg-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-400">
            {[
              '3 products',
              'UK-focused',
              'GDPR compliant',
              'Companies House API partner',
            ].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5A4BFF]" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Join UK professionals who rely on UltAi Group for compliance, intake, and document intelligence.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/pricing"
            className="px-8 py-3 bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white font-semibold rounded-lg transition-colors"
          >
            View Pricing
          </Link>
          <Link
            href="/contact"
            className="px-8 py-3 border border-white/20 hover:border-white/40 text-white font-semibold rounded-lg transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
}
