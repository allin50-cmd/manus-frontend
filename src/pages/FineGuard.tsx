import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import PublicNav from '@/components/layout/PublicNav';
import { Shield, ArrowRight, Bell, CheckCircle, Clock, FileSearch } from 'lucide-react';

const FEATURES = [
  {
    title: 'Deadline Watch',
    description: 'Track filing windows, overdue accounts, and confirmation statement risk in one place.',
    icon: Clock,
  },
  {
    title: 'Alert Routing',
    description: 'Surface at-risk companies for review before penalties or enforcement issues escalate.',
    icon: Bell,
  },
  {
    title: 'Compliance Bundle',
    description: 'Generate a structured company report with status, deadlines, risk, and next actions.',
    icon: FileSearch,
  },
];

const CHECKS = [
  'Companies House status and filing deadlines',
  'Penalty risk indicators for overdue filings',
  'Protection status for monitored companies',
];

export default function FineGuard() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <PublicNav variant="light" />
      <div className="max-w-7xl mx-auto px-4 py-16 space-y-14">
        <section className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-[#C9A64A]/30 px-3 py-1 text-xs font-semibold text-[#8A6D1F] mb-6">
              <Shield className="w-3.5 h-3.5" />
              Compliance monitoring
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#1A1A1A] mb-6">
              FineGuard Compliance Cloud
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mb-8">
              Automated Companies House tracking for teams that need filing risk, penalty exposure,
              and monitoring status without spreadsheet drift.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => setLocation('/compliance-bundle')}
                className="bg-[#C9A64A] hover:bg-[#B8954A] text-white px-7 py-6 text-base"
              >
                Get Compliance Bundle
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                onClick={() => setLocation('/pricing')}
                variant="outline"
                className="border-[#1A1A1A]/20 px-7 py-6 text-base"
              >
                View Pricing
              </Button>
            </div>
          </div>

          <div className="bg-white border border-[#1A1A1A]/10 rounded-xl p-6 shadow-sm">
            <p className="text-sm font-semibold text-[#1A1A1A] mb-5">Bundle preview</p>
            <div className="space-y-4">
              {CHECKS.map((check) => (
                <div key={check} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#C9A64A] mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{check}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              {['Status', 'Risk', 'Actions'].map((item) => (
                <div key={item} className="rounded-lg bg-[#F8F8F8] border border-gray-200 px-3 py-4">
                  <p className="text-xs text-gray-500">{item}</p>
                  <p className="text-sm font-semibold text-[#1A1A1A] mt-1">Included</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-4">
          {FEATURES.map(({ title, description, icon: Icon }) => (
            <div key={title} className="bg-white border border-[#1A1A1A]/10 rounded-xl p-5">
              <div className="w-10 h-10 rounded-lg bg-[#C9A64A]/10 text-[#A98427] flex items-center justify-center mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <h2 className="text-base font-semibold text-[#1A1A1A]">{title}</h2>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{description}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
