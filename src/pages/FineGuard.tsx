import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LandingNav from '@/components/layout/LandingNav';
import {
  Shield,
  Bell,
  AlertCircle,
  Users,
  Calendar,
  Code,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Real-Time Monitoring',
    description:
      'FineGuard watches Companies House 24/7 and updates your dashboard within minutes of any filing, confirmation, or status change for every company you track.',
  },
  {
    icon: Bell,
    title: 'Automatic Alerts',
    description:
      'Receive email, SMS, or webhook notifications at configurable lead times — 90, 60, 30, and 7 days before every filing deadline — so nothing slips through.',
  },
  {
    icon: AlertCircle,
    title: 'Penalty Risk Scoring',
    description:
      'Each filing gets a risk score based on historical patterns, entity size, and days remaining. Red, amber, and green indicators make prioritisation effortless.',
  },
  {
    icon: Users,
    title: 'Director Tracking',
    description:
      'Monitor director appointments, resignations, and PSC changes across your entire portfolio. Alerts fire the moment Companies House records an update.',
  },
  {
    icon: Calendar,
    title: 'Filing Calendar',
    description:
      'A unified calendar view shows every confirmation statement, annual account, and event-driven filing across all your monitored companies in one place.',
  },
  {
    icon: Code,
    title: 'API Integration',
    description:
      'Push compliance data directly into your practice management system, ERP, or data warehouse using our REST API with webhook support and SDKs for Node and Python.',
  },
];

const mockCompanies = [
  {
    name: 'Harrington Infrastructure PLC',
    number: '12345678',
    status: 'At risk',
    statusColor: 'bg-red-100 text-red-700 border-red-200',
    filing: 'Confirmation Statement',
    daysUntilDue: 8,
    dueDate: '14 May 2026',
    barColor: 'bg-red-500',
    barWidth: '92%',
  },
  {
    name: 'Meridian Capital Group Ltd',
    number: '87654321',
    status: 'Due soon',
    statusColor: 'bg-amber-100 text-amber-700 border-amber-200',
    filing: 'Annual Accounts',
    daysUntilDue: 31,
    dueDate: '6 Jun 2026',
    barColor: 'bg-amber-500',
    barWidth: '55%',
  },
  {
    name: 'Blackwood Financial Services Ltd',
    number: '11223344',
    status: 'Compliant',
    statusColor: 'bg-green-100 text-green-700 border-green-200',
    filing: 'Confirmation Statement',
    daysUntilDue: 112,
    dueDate: '25 Aug 2026',
    barColor: 'bg-green-500',
    barWidth: '18%',
  },
];

export default function FineGuard() {
  return (
    <div className="min-h-screen bg-[#F8F8F8] text-[#1A1A1A]">
      <LandingNav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-white border-b border-gray-200">
        <div className="absolute inset-0 bg-gradient-to-br from-[#C9A64A]/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#C9A64A]/40 bg-[#C9A64A]/10 text-[#9A7A32] text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            Companies House Compliance Monitoring
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
            Never miss a Companies House
            <br />
            <span className="text-[#C9A64A]">deadline again</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            FineGuard monitors every filing deadline across your entire company portfolio, scores
            penalty risk in real time, and alerts your team before a single pound is lost.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/compliance-bundle">
              <Button className="bg-[#C9A64A] hover:bg-[#B8954A] text-white px-8 py-6 text-base font-semibold h-auto">
                Get Compliance Bundle
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/book-demo">
              <Button
                variant="outline"
                className="border-gray-300 text-[#1A1A1A] hover:bg-gray-50 px-8 py-6 text-base font-semibold h-auto"
              >
                Book a Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything compliance requires</h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Six capabilities built specifically for the demands of UK corporate compliance — from
            sole practitioners to multi-entity groups.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-gray-200 bg-white p-6 hover:border-[#C9A64A]/40 hover:shadow-md transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-lg bg-[#C9A64A]/10 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-[#C9A64A]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Live demo section */}
      <section className="bg-gray-100 border-y border-gray-200 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Your compliance dashboard</h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              See the filing status of every company you manage — at a glance, in real time.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {/* Dashboard header */}
            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#C9A64A]" />
                  <span className="font-semibold text-sm">FineGuard — Compliance Overview</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Live
                </div>
              </div>

              {/* Company cards */}
              <div className="divide-y divide-gray-100">
                {mockCompanies.map((co) => (
                  <div key={co.number} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <p className="font-semibold text-sm text-[#1A1A1A]">{co.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Co. No. {co.number} · {co.filing}
                        </p>
                      </div>
                      <Badge
                        className={`border text-xs font-semibold shrink-0 ${co.statusColor}`}
                      >
                        {co.status}
                      </Badge>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full ${co.barColor} transition-all`}
                        style={{ width: co.barWidth }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Due {co.dueDate}</span>
                      <span
                        className={
                          co.daysUntilDue <= 14
                            ? 'text-red-600 font-semibold'
                            : co.daysUntilDue <= 45
                            ? 'text-amber-600 font-semibold'
                            : 'text-green-600 font-semibold'
                        }
                      >
                        {co.daysUntilDue} days remaining
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center gap-2 text-xs text-gray-400">
                <CheckCircle className="w-4 h-4 text-[#C9A64A]" />
                Monitoring 3 companies · Last updated 2 minutes ago
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Get compliance bundle CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="rounded-2xl bg-[#1A1A1A] text-white p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              Get your compliance bundle today
            </h2>
            <p className="text-gray-400 max-w-lg">
              Includes a full Companies House audit for up to 10 companies, 12 months of monitoring,
              and a dedicated compliance report — delivered within 48 hours.
            </p>
          </div>
          <Link href="/compliance-bundle" className="shrink-0">
            <Button className="bg-[#C9A64A] hover:bg-[#B8954A] text-white px-8 py-6 text-base font-semibold h-auto whitespace-nowrap">
              Get Compliance Bundle
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="border-t border-gray-200 bg-white py-16 text-center">
        <p className="text-gray-500 mb-4 text-lg">
          Transparent pricing — from single-entity startups to multi-entity groups.
        </p>
        <Link href="/pricing">
          <Button
            variant="outline"
            className="border-[#C9A64A]/50 text-[#9A7A32] hover:bg-[#C9A64A]/5 hover:border-[#C9A64A]"
          >
            Compare plans &amp; pricing
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </section>
    </div>
  );
}
