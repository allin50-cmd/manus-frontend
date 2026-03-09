import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, ArrowRight, AlertTriangle, CheckCircle2, XCircle, Clock,
  Building2, FileCheck, Bell, FolderLock, BarChart3, Zap, Star,
  ChevronDown, ChevronUp, Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';

const PROBLEMS = [
  {
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-50',
    title: 'Missed Companies House Filings',
    desc: 'Late filing penalties start at £150 and escalate to £1,500+ for accounts more than 6 months overdue. Confirmation statement failures trigger prosecution risk.'
  },
  {
    icon: AlertTriangle,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    title: 'VAT Submission Errors',
    desc: "Arithmetic errors in VAT returns can trigger HMRC investigations. Box 3 must equal Box 1 + Box 2, and Box 5 must equal Box 3 - Box 4. One mistake affects your client's entire trading relationship with HMRC."
  },
  {
    icon: Clock,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    title: 'Spreadsheet Deadline Tracking',
    desc: 'Managing hundreds of client deadlines in spreadsheets is error-prone and time-consuming. One missed cell update can mean your client faces a strike-off notice.'
  },
  {
    icon: Building2,
    color: 'text-purple-500',
    bg: 'bg-purple-50',
    title: 'Unexpected Director Changes',
    desc: 'Companies House director appointments and resignations trigger compliance obligations. Without automated monitoring, your firm may miss critical changes affecting client liability.'
  }
];

const FEATURES = [
  {
    icon: FileCheck,
    title: '£1 VAT Pre-Submission Checker',
    desc: 'Validate all 9 boxes of any VAT return in seconds. Catch arithmetic errors, negative totals, abnormal ratios, and rounding issues before submission.',
    badge: 'Pay per use'
  },
  {
    icon: Building2,
    title: '£1 Companies House Deadline Scanner',
    desc: 'Upload a CSV of company numbers and instantly scan for overdue filings, upcoming deadlines, director changes, and strike-off notices.',
    badge: 'Pay per use'
  },
  {
    icon: BarChart3,
    title: 'Compliance Dashboard',
    desc: 'See all your clients in one view. Green for compliant, amber for approaching deadlines, red for overdue. Risk indicators and next action dates at a glance.',
    badge: 'Pro'
  },
  {
    icon: Clock,
    title: 'Compliance Timeline',
    desc: 'Every company gets a full chronological audit trail — accounts filed, confirmation statements, director changes, VAT returns, document uploads.',
    badge: 'Pro'
  },
  {
    icon: Bell,
    title: 'Automated Alerts',
    desc: 'Receive email, Slack, or Microsoft Teams notifications when deadlines approach or are breached. Never miss a filing again.',
    badge: 'Pro'
  },
  {
    icon: FolderLock,
    title: '7-Year Document Vault',
    desc: 'Securely store VAT returns, accounts, and correspondence per company. AES-256 encrypted, GDPR compliant, with automatic 7-year retention policy.',
    badge: 'Pro'
  }
];

const PLANS = [
  {
    name: 'Free',
    price: '£0',
    period: '/month',
    desc: 'Try the entry tools',
    features: [
      '£1 VAT Pre-Submission Check',
      '£1 Companies House Scanner',
      'Up to 5 companies',
      'Basic compliance status',
      'Email support'
    ],
    cta: 'Get Started Free',
    href: '/register',
    highlighted: false
  },
  {
    name: 'Pro',
    price: '£59',
    period: '/month',
    desc: 'For growing accounting firms',
    features: [
      'Everything in Free',
      'Unlimited companies',
      'Full Compliance Dashboard',
      'Compliance Timeline per company',
      'Automated alerts (email, Slack, Teams)',
      '7-Year Document Vault',
      'Daily deadline monitoring',
      'Priority support'
    ],
    cta: 'Start Pro Trial',
    href: '/register',
    highlighted: true
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For large firms & networks',
    features: [
      'Everything in Pro',
      'Multi-firm management',
      'Custom API integrations',
      'White-labelling',
      'Dedicated account manager',
      'SLA guarantee',
      'Custom data retention'
    ],
    cta: 'Contact Sales',
    href: '/contact',
    highlighted: false
  }
];

const FAQS = [
  {
    q: 'How does the £1 VAT checker work?',
    a: 'You enter all 9 boxes from a client\'s VAT return and we instantly validate the arithmetic (box3 = box1 + box2, box5 = box3 - box4), check for abnormal VAT ratios, negative totals, and rounding anomalies. You get a PASS, WARNING, or ERROR result with detailed explanations. You pay £1 per check via Stripe.'
  },
  {
    q: 'What does the Companies House scanner check?',
    a: 'Upload a CSV with company registration numbers and we query the Companies House API in real time for each. We return accounts due dates, confirmation statement due dates, overdue filings, strike-off notices, and recent director changes — with risk indicators and estimated penalty exposure.'
  },
  {
    q: 'Is my client data secure?',
    a: 'Yes. All documents are encrypted with AES-256 and stored in compliance with GDPR. We apply a 7-year retention policy matching UK accounting requirements. All API traffic is over TLS. We maintain a full audit log of all actions.'
  },
  {
    q: 'How often is Companies House data refreshed?',
    a: 'The entry tools query Companies House in real time. Pro subscribers benefit from our daily background monitoring engine that checks all their companies and triggers alerts for deadline changes.'
  },
  {
    q: 'Can I cancel my Pro subscription anytime?',
    a: 'Yes. Cancel anytime with no penalties. Your data remains accessible until the end of your billing period.'
  }
];

export default function FineGuard() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* HERO */}
      <section className="bg-gradient-to-br from-[#1A1A1A] via-[#2A2A2A] to-[#1A1A1A] text-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Shield className="w-10 h-10 text-[#C9A64A]" />
            <span className="text-[#C9A64A] font-semibold text-lg tracking-wide uppercase">FineGuard Pro</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Never Miss a UK Filing<br />
            <span className="text-[#C9A64A]">Deadline Again</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-10">
            FineGuard automatically monitors Companies House and HMRC compliance for every client your firm manages — with instant VAT validation and real-time deadline alerts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/vat-checker">
              <Button size="lg" className="bg-[#C9A64A] hover:bg-[#B8954A] text-white px-8 py-6 text-lg font-semibold">
                <FileCheck className="w-5 h-5 mr-2" />
                Run a £1 VAT Pre-Submission Check
              </Button>
            </Link>
            <Link to="/deadline-scanner">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg">
                <Building2 className="w-5 h-5 mr-2" />
                Upload Company List for Deadline Scan
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-gray-400 text-sm">
            Trusted by 500+ UK accounting firms · No subscription needed for entry tools
          </p>
        </div>
      </section>

      {/* SOCIAL PROOF BAR */}
      <section className="bg-[#C9A64A]/10 border-y border-[#C9A64A]/20 py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-8 text-center">
          {[
            { value: '£2.4M+', label: 'Penalties avoided' },
            { value: '50,000+', label: 'VAT checks run' },
            { value: '500+', label: 'Accounting firms' },
            { value: '99.9%', label: 'Uptime SLA' }
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl font-bold text-[#1A1A1A]">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section className="py-20 px-4 bg-[#F8F8F8]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="danger" className="mb-4 text-sm px-3 py-1">The Risk Is Real</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4">
              The Hidden Compliance Risks Facing Every UK Accountant
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Managing dozens or hundreds of clients means compliance deadlines fall through the cracks. The consequences are severe.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {PROBLEMS.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className={`${p.bg} border border-gray-200 rounded-xl p-6`}>
                  <div className="flex items-start gap-4">
                    <div className={`${p.color} mt-1`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-[#1A1A1A] mb-2">{p.title}</h3>
                      <p className="text-gray-600">{p.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-10 p-6 bg-[#1A1A1A] text-white rounded-xl text-center">
            <p className="text-lg font-semibold">
              FineGuard automates all of this — so you can focus on advising clients, not chasing deadlines.
            </p>
          </div>
        </div>
      </section>

      {/* ENTRY TOOLS SECTION */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="success" className="mb-4 text-sm px-3 py-1">Entry Tools — No Subscription Needed</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4">
              Try the Tools That Protect Your Clients for £1
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {/* VAT Checker */}
            <div className="border-2 border-[#C9A64A] rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Badge className="bg-[#C9A64A] text-white text-sm px-3 py-1">£1 per check</Badge>
              </div>
              <FileCheck className="w-12 h-12 text-[#C9A64A] mb-4" />
              <h3 className="text-2xl font-bold text-[#1A1A1A] mb-3">VAT Return Pre-Submission Checker</h3>
              <p className="text-gray-600 mb-6">
                Enter all 9 boxes from a client's VAT return. We validate arithmetic, detect anomalies, and return a PASS / WARNING / ERROR with full explanation before you submit to HMRC.
              </p>
              <ul className="space-y-2 mb-8">
                {['Box arithmetic validation (Box 3 = Box 1 + 2)', 'Box 5 net VAT calculation check', 'Abnormal VAT ratio detection', 'Negative total warnings', 'Rounding anomaly detection'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/vat-checker">
                <Button className="w-full bg-[#C9A64A] hover:bg-[#B8954A] text-white py-6 text-base font-semibold">
                  Run VAT Check — £1
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Deadline Scanner */}
            <div className="border-2 border-gray-200 rounded-2xl p-8 relative overflow-hidden hover:border-[#C9A64A] transition-colors">
              <div className="absolute top-4 right-4">
                <Badge className="bg-[#1A1A1A] text-white text-sm px-3 py-1">£1 per scan</Badge>
              </div>
              <Building2 className="w-12 h-12 text-[#1A1A1A] mb-4" />
              <h3 className="text-2xl font-bold text-[#1A1A1A] mb-3">Companies House Deadline Scanner</h3>
              <p className="text-gray-600 mb-6">
                Upload a CSV of company registration numbers. We query Companies House in real time and return a full compliance picture for each company.
              </p>
              <ul className="space-y-2 mb-8">
                {['Accounts filing due dates', 'Confirmation statement deadlines', 'Overdue filing detection', 'Strike-off notice warnings', 'Director appointment / resignation alerts'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/deadline-scanner">
                <Button className="w-full bg-[#1A1A1A] hover:bg-[#333] text-white py-6 text-base font-semibold">
                  Scan Deadlines — £1
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-20 px-4 bg-[#F8F8F8]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4">
              Everything Your Firm Needs for UK Compliance
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Go beyond one-off checks with automated monitoring, a full compliance dashboard, and a 7-year document vault.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white rounded-xl p-6 border border-gray-200 hover:border-[#C9A64A] hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 bg-[#C9A64A]/10 rounded-lg">
                      <Icon className="w-6 h-6 text-[#C9A64A]" />
                    </div>
                    <Badge variant={f.badge === 'Pay per use' ? 'warning' : 'secondary'} className="text-xs">
                      {f.badge}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-[#1A1A1A] mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-600">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* COMPLIANCE TIMELINE SHOWCASE */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="success" className="mb-4">Compliance Timeline</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-6">
                A Complete Audit Trail for Every Client Company
              </h2>
              <p className="text-gray-600 mb-6 text-lg">
                Every compliance event is timestamped and recorded. Accounts filed, VAT returns submitted, director changes, document uploads — all in one place.
              </p>
              <ul className="space-y-4">
                {[
                  { icon: CheckCircle2, color: 'text-green-500', label: 'Accounts filed on time', date: '14 Jan 2025' },
                  { icon: FileCheck, color: 'text-blue-500', label: 'VAT Return Q4 — PASS', date: '07 Feb 2025' },
                  { icon: Bell, color: 'text-amber-500', label: 'Confirmation statement due in 30 days', date: '01 Mar 2025' },
                  { icon: Building2, color: 'text-purple-500', label: 'Director appointment — Jane Smith', date: '15 Mar 2025' },
                ].map((event) => {
                  const Icon = event.icon;
                  return (
                    <div key={event.label} className="flex items-center gap-4">
                      <div className={`${event.color} p-2 bg-gray-50 rounded-full`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#1A1A1A]">{event.label}</p>
                        <p className="text-xs text-gray-500">{event.date}</p>
                      </div>
                    </div>
                  );
                })}
              </ul>
            </div>
            <div className="bg-[#F8F8F8] rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-[#1A1A1A]">Acme Ltd — Compliance Status</h4>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">COMPLIANT</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Annual Accounts', value: 'Due 31 Dec 2025', status: 'green' },
                  { label: 'Confirmation Statement', value: 'Due 15 Apr 2025', status: 'amber' },
                  { label: 'VAT Return Q1', value: 'Due 07 May 2025', status: 'green' },
                  { label: 'Risk Level', value: 'Low', status: 'green' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                    <span className="text-sm text-gray-600">{row.label}</span>
                    <span className={`text-sm font-medium ${
                      row.status === 'green' ? 'text-green-700' :
                      row.status === 'amber' ? 'text-amber-700' : 'text-red-700'
                    }`}>{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-700 font-medium">⚠ Confirmation statement due in 45 days</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20 px-4 bg-[#F8F8F8]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-600 text-lg">Start free, upgrade when you need full monitoring</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 ${
                  plan.highlighted
                    ? 'bg-[#1A1A1A] text-white border-2 border-[#C9A64A] relative'
                    : 'bg-white border border-gray-200'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[#C9A64A] text-white px-4 py-1">Most Popular</Badge>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className={`text-xl font-bold mb-1 ${plan.highlighted ? 'text-white' : 'text-[#1A1A1A]'}`}>
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className={`text-4xl font-bold ${plan.highlighted ? 'text-[#C9A64A]' : 'text-[#1A1A1A]'}`}>
                      {plan.price}
                    </span>
                    <span className={`text-sm ${plan.highlighted ? 'text-gray-300' : 'text-gray-500'}`}>{plan.period}</span>
                  </div>
                  <p className={`text-sm ${plan.highlighted ? 'text-gray-300' : 'text-gray-500'}`}>{plan.desc}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.highlighted ? 'text-[#C9A64A]' : 'text-green-500'}`} />
                      <span className={plan.highlighted ? 'text-gray-200' : 'text-gray-700'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to={plan.href}>
                  <Button
                    className={`w-full py-5 font-semibold ${
                      plan.highlighted
                        ? 'bg-[#C9A64A] hover:bg-[#B8954A] text-white'
                        : 'border border-gray-300 bg-white hover:bg-gray-50 text-[#1A1A1A]'
                    }`}
                    variant={plan.highlighted ? 'default' : 'outline'}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-500 text-sm mt-8">
            Entry tools (VAT checker & deadline scanner) are always £1 per use — no subscription required.
          </p>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4">Trusted by UK Accountants</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "FineGuard caught a VAT error that would have triggered an HMRC investigation. The £1 check saved us and our client significant stress.",
                name: "Sarah Mitchell, FCA",
                firm: "Mitchell & Partners, London"
              },
              {
                quote: "We manage 200 client companies. Before FineGuard, we tracked everything in spreadsheets. Now our whole team sees compliance status at a glance.",
                name: "David Chen",
                firm: "Chen Accountancy, Manchester"
              },
              {
                quote: "The deadline scanner is brilliant. Upload our CSV on Monday morning and we have a full risk report before our client calls start.",
                name: "Rebecca Walsh, ACA",
                firm: "Walsh & Associates, Edinburgh"
              }
            ].map((t) => (
              <div key={t.name} className="bg-[#F8F8F8] rounded-xl p-6 border border-gray-200">
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-[#C9A64A] fill-[#C9A64A]" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 text-sm italic">"{t.quote}"</p>
                <div>
                  <p className="font-semibold text-[#1A1A1A] text-sm">{t.name}</p>
                  <p className="text-gray-500 text-xs">{t.firm}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-[#F8F8F8]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-5 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-[#1A1A1A]">{faq.q}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20 px-4 bg-[#1A1A1A] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <Zap className="w-12 h-12 text-[#C9A64A] mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Start Protecting Your Clients Today
          </h2>
          <p className="text-gray-300 text-lg mb-10 max-w-2xl mx-auto">
            No subscription needed to try the entry tools. Run your first VAT check or deadline scan for £1.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="bg-[#C9A64A] hover:bg-[#B8954A] text-white px-10 py-6 text-lg font-semibold">
                Create Free Account
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/vat-checker">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-10 py-6 text-lg">
                Try VAT Checker — £1
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#111] text-gray-400 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-6 h-6 text-[#C9A64A]" />
                <span className="text-white font-bold">FineGuard Pro</span>
              </div>
              <p className="text-sm max-w-xs">
                UK compliance monitoring and VAT validation for accounting firms.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="text-white font-semibold mb-3 text-sm">Tools</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link to="/vat-checker" className="hover:text-white transition-colors">VAT Checker</Link></li>
                  <li><Link to="/deadline-scanner" className="hover:text-white transition-colors">Deadline Scanner</Link></li>
                  <li><Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-3 text-sm">Company</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                  <li><Link to="/register" className="hover:text-white transition-colors">Sign Up</Link></li>
                  <li><Link to="/login" className="hover:text-white transition-colors">Log In</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-3 text-sm">Legal</h4>
                <ul className="space-y-2 text-sm">
                  <li><span className="cursor-pointer hover:text-white transition-colors">Privacy Policy</span></li>
                  <li><span className="cursor-pointer hover:text-white transition-colors">Terms of Service</span></li>
                  <li><span className="cursor-pointer hover:text-white transition-colors">GDPR</span></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs">© 2025 FineGuard Pro. All rights reserved. Registered in England & Wales.</p>
            <p className="text-xs">AES-256 Encrypted · GDPR Compliant · TLS 1.3</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
