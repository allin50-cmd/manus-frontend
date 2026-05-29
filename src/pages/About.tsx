import PublicNav from '@/components/layout/PublicNav';
import { Building2, FileText, Mic, ShieldCheck } from 'lucide-react';

const SERVICE_AREAS = [
  {
    title: 'Company Monitoring',
    description: 'Company monitoring and compliance checks for filing risk.',
    icon: ShieldCheck,
  },
  {
    title: 'Service Intake',
    description: 'Secure intake and matter triage for front-door workflows.',
    icon: FileText,
  },
  {
    title: 'AI Voice Reception',
    description: 'Call transcript capture, risk gating, and human escalation.',
    icon: Mic,
  },
];

export default function About() {
  return (
    <div className="min-h-screen theme-light-default bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014]">
      <PublicNav />
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Building2 className="w-16 h-16 text-[#C9A64A] mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-white mb-4">About FineGuard Service</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            A focused SME service for compliance checks, monitored companies, structured intake, and AI voice reception.
          </p>
        </div>

        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8 items-start">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold text-white">What the service is for</h2>
            <p className="text-sm text-gray-400 mt-4 leading-relaxed">
              FineGuard Service connects public enquiries to the operations dashboard:
              leads, intake records, compliance bundle requests, monitored company status, and AI reception outcomes.
              Each route is designed to be useful alone while still feeding the same operational core.
            </p>
            <div className="grid grid-cols-3 gap-3 mt-6">
              {['Capture', 'Review', 'Monitor'].map((item) => (
                <div key={item} className="rounded-lg bg-[#0B0C10]/50 border border-white/10 p-3 text-center">
                  <p className="text-xs font-semibold text-gray-200">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {SERVICE_AREAS.map(({ title, description, icon: Icon }) => (
              <div key={title} className="rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="w-10 h-10 rounded-lg bg-[#5A4BFF]/15 text-indigo-200 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-base font-semibold text-white">{title}</h2>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
