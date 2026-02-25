import { Link } from 'wouter';
import {
  ArrowRight, Building2, FileText, Receipt,
  Calculator, HelpCircle, Plus, Zap,
} from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';

interface Service {
  name: string;
  icon: typeof Building2;
  price: string;
  unit: string;
  features: string[];
}

const services: Service[] = [
  {
    name: 'Companies House',
    icon: Building2,
    price: '£1',
    unit: '/month per company',
    features: ['Annual return deadlines', 'Accounts filing dates', 'Director changes'],
  },
  {
    name: 'Corporate Tax',
    icon: FileText,
    price: '£1',
    unit: '/month per company',
    features: ['Corporation tax returns', 'Payment deadlines', 'HMRC compliance'],
  },
  {
    name: 'Self Assessment',
    icon: Calculator,
    price: '£1',
    unit: '/month per company',
    features: ['Tax return deadlines', 'Payment due dates', 'Quarterly reminders'],
  },
  {
    name: 'VAT Returns',
    icon: Receipt,
    price: '£1',
    unit: '/month per company',
    features: ['VAT return deadlines', 'Payment schedules', 'MTD compliance'],
  },
];

const faqs = [
  { q: 'How does per-company pricing work?', a: 'Each service costs £1 per month for each company you monitor. Add as many companies and services as you need — you only pay for what you use.' },
  { q: 'Can I add or remove services at any time?', a: 'Yes. Add or remove individual services whenever you like. Changes take effect immediately and billing is adjusted pro-rata.' },
  { q: 'Is there a minimum commitment?', a: 'No. There are no contracts or minimum terms. Cancel any service at any time.' },
  { q: 'Do you offer discounts for charities?', a: 'Yes. Contact us for special pricing for registered charities and CICs.' },
  { q: 'How does Companies House monitoring work?', a: 'We poll Companies House records multiple times daily and cross-reference filing deadlines, director changes, and compliance events automatically.' },
  { q: 'Is my data secure?', a: 'All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We are SOC 2 compliant and GDPR-ready.' },
];

export default function Pricing() {
  usePageTitle('Pricing');

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#5A4BFF]/10 border border-[#5A4BFF]/20 text-[#5A4BFF] text-sm font-medium mb-8">
            <Zap className="w-4 h-4" /> Simple, Transparent Pricing
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
            Pay Only for <br className="hidden sm:block" />
            <span className="text-[#5A4BFF]">What You Monitor</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Select individual alert services based on your compliance needs.
            Each service is <span className="text-white font-semibold">£1 per month per company</span>.
          </p>
        </div>
      </section>

      {/* Service Cards */}
      <section className="pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <div
                key={service.name}
                className="relative rounded-3xl p-8 flex flex-col bg-white/5 border border-white/10 hover:border-[#5A4BFF]/30 transition-all"
              >
                <div className="mb-6">
                  <service.icon className="w-10 h-10 mb-4 text-[#5A4BFF]" />
                  <h3 className="text-xl font-bold text-white">{service.name}</h3>
                </div>
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">{service.price}</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{service.unit}</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {service.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-[#5A4BFF] mt-0.5">•</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/signup?service=${encodeURIComponent(service.name)}`}
                  className="w-full py-3 rounded-full text-center font-bold text-sm transition-colors flex items-center justify-center gap-2 bg-[#5A4BFF] text-white hover:bg-[#6B5BFF] shadow-lg shadow-[#5A4BFF]/25"
                >
                  <Plus className="w-4 h-4" /> Add Service
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-black text-white mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#5A4BFF]/15 border border-[#5A4BFF]/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-black text-[#5A4BFF]">1</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Add your companies</h3>
              <p className="text-sm text-slate-400">Import from Companies House or add them manually.</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#5A4BFF]/15 border border-[#5A4BFF]/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-black text-[#5A4BFF]">2</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Pick your services</h3>
              <p className="text-sm text-slate-400">Choose which compliance alerts you need — £1/mo each per company.</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#5A4BFF]/15 border border-[#5A4BFF]/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-black text-[#5A4BFF]">3</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Stay compliant</h3>
              <p className="text-sm text-slate-400">Get alerts before deadlines and never miss a filing again.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <HelpCircle className="w-10 h-10 text-[#5A4BFF] mx-auto mb-4" />
            <h2 className="text-3xl font-black text-white">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-2">{faq.q}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Still have questions?</h2>
          <p className="text-lg text-slate-400 mb-8">Talk to our team and find the right setup for your firm.</p>
          <Link href="/book-demo" className="inline-flex items-center gap-2 px-8 py-4 bg-[#5A4BFF] text-white rounded-full font-bold text-lg hover:bg-[#6B5BFF] transition-colors shadow-lg shadow-[#5A4BFF]/25">
            Book a Demo <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
