import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Shield, ArrowRight, Eye, Calendar, UserCheck,
  Clock, Ban, BarChart3, AlertTriangle, CheckCircle2,
  Building2,
} from 'lucide-react';
import LandingNav from '@/components/layout/LandingNav';
import LandingFooter from '@/components/layout/LandingFooter';

const FEATURES = [
  { icon: Eye,       title: 'Companies House Monitoring', desc: 'Continuous polling of Companies House API for changes to officer details, charges, accounts, and confirmation statements.' },
  { icon: Calendar,  title: 'Filing Deadline Alerts',     desc: 'Proactive reminders at 60, 30, 14, and 7 days before confirmation statements, accounts, and PSC filings are due.' },
  { icon: UserCheck, title: 'Director Change Tracking',   desc: 'Instant alerts when directors are appointed, resign, or change their registered details — with full change history.' },
  { icon: Clock,     title: 'Annual Return Reminders',    desc: 'Automated email and SMS reminders to clients so no annual return or accounts deadline is ever missed.' },
  { icon: Ban,       title: 'Penalty Prevention',         desc: 'Track Companies House late filing penalties before they escalate. FineGuard has a 100% on-time record for monitored companies.' },
  { icon: BarChart3, title: 'Bulk Processing',            desc: 'Monitor hundreds of client companies from one dashboard with bulk import via CSV or direct Companies House number entry.' },
];

export default function FineGuard() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <LandingNav theme="light" />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C9A64A]/10 border border-[#C9A64A]/30 text-[#B8954A] text-sm font-medium mb-6">
            <Shield className="w-3.5 h-3.5" />
            Companies House Compliance
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-[#1A1A1A] leading-tight mb-6">
            Zero compliance{' '}
            <span className="bg-gradient-to-r from-[#C9A64A] to-[#E5C068] bg-clip-text text-transparent">
              fines. Ever.
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            FineGuard monitors every Companies House deadline for your client portfolio and alerts you before penalties
            can be issued — so you never miss a filing again.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={() => setLocation('/compliance-bundle')}
              className="bg-[#C9A64A] hover:bg-[#B8954A] text-white px-8 py-6 text-base"
            >
              Get Compliance Bundle
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              onClick={() => setLocation('/book-demo')}
              variant="ghost"
              className="border border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400 px-8 py-6 text-base"
            >
              Book Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 border-y border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '100%',    label: 'On-time filing record' },
              { value: '3,200+',  label: 'Companies monitored' },
              { value: '£0',      label: 'Penalties incurred by clients' },
              { value: '< 5 min', label: 'Average alert response time' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-bold text-[#1A1A1A] mb-1">{s.value}</p>
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
            <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4">Never miss a Companies House deadline</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              FineGuard watches every company in your portfolio around the clock — so you can focus on your clients.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-xl bg-white border border-gray-100 shadow-sm hover:border-[#C9A64A]/40 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-[#C9A64A]/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-[#C9A64A]" />
                </div>
                <h3 className="font-semibold text-[#1A1A1A] mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Demo Mockup */}
      <section className="py-20 px-4 bg-white border-y border-gray-200">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4">See a live alert</h2>
            <p className="text-gray-500">This is exactly what your team sees when FineGuard detects an upcoming deadline.</p>
          </div>
          <div className="max-w-lg mx-auto">
            <div className="rounded-2xl border-2 border-[#C9A64A]/40 bg-white shadow-xl overflow-hidden">
              <div className="bg-[#C9A64A] px-5 py-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-semibold">Filing Deadline Alert</span>
                <span className="ml-auto text-white/80 text-xs">FineGuard</span>
              </div>
              <div className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#C9A64A]/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-[#C9A64A]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1A1A1A]">ACME Holdings Ltd</p>
                    <p className="text-xs text-gray-400">Company #09876543</p>
                  </div>
                </div>
                <div className="space-y-2 mb-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Filing type</span>
                    <span className="font-medium text-[#1A1A1A]">Confirmation Statement Due</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Days remaining</span>
                    <span className="font-bold text-red-500">7 days</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Potential penalty</span>
                    <span className="font-medium text-[#1A1A1A]">£150</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 px-3 bg-[#C9A64A] text-white text-sm rounded-lg font-medium hover:bg-[#B8954A] transition-colors">
                    File Now via CH
                  </button>
                  <button className="py-2 px-3 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                    Dismiss
                  </button>
                </div>
              </div>
              <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#C9A64A]" />
                <span className="text-xs text-gray-400">Powered by FineGuard real-time monitoring</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-10 rounded-2xl bg-gradient-to-br from-[#C9A64A]/10 to-[#E5C068]/5 border border-[#C9A64A]/25">
            <Shield className="w-10 h-10 text-[#C9A64A] mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4">Start monitoring today</h2>
            <p className="text-gray-500 mb-8">
              Import your client company list in minutes. FineGuard starts monitoring immediately — your first alert
              arrives within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={() => setLocation('/compliance-bundle')}
                className="bg-[#C9A64A] hover:bg-[#B8954A] text-white px-8 py-3"
              >
                Get Compliance Bundle
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                onClick={() => setLocation('/pricing')}
                variant="ghost"
                className="border border-gray-300 text-gray-600 hover:text-gray-900 px-8 py-3"
              >
                View Pricing
              </Button>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter theme="light" />
    </div>
  );
}
