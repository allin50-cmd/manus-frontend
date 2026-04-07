import { PageContainer } from '@/components/shared/PageContainer';
import { ShieldCheck, Database, Smile } from 'lucide-react';

const pillars = [
  { icon: Database, title: 'Official Data', description: 'We use official Companies House data. Nothing synthetic, nothing delayed.' },
  { icon: ShieldCheck, title: 'Secure & Reliable', description: 'Your data is encrypted and never shared with third parties.' },
  { icon: Smile, title: 'Made for You', description: 'Simple, affordable and built for the way UK businesses actually work.' },
];

export default function AboutPage() {
  return (
    <PageContainer className="max-w-3xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900">Built for UK Businesses.<br />Backed by Compliance.</h1>
        <p className="text-slate-600 mt-4 max-w-xl mx-auto">
          FineGuard Pro helps small businesses and accountants stay compliant with Companies House requirements.
          We monitor deadlines, send timely alerts, and help you avoid penalties.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-16">
        {pillars.map(({ icon: Icon, title, description }) => (
          <div key={title} className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
              <Icon className="w-6 h-6 text-blue-600" />
            </div>
            <p className="font-semibold text-slate-900">{title}</p>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        ))}
      </div>

      <div id="terms" className="rounded-xl border bg-slate-50 p-6 space-y-3 mb-8">
        <h2 className="text-lg font-semibold text-slate-900">Our Mission</h2>
        <p className="text-sm text-slate-600">
          To save businesses from costly compliance mistakes through smart monitoring and timely alerts.
          Every UK company deserves to know when their filings are due — without paying for an accountant just to track dates.
        </p>
      </div>

      <div id="privacy" className="rounded-xl border bg-slate-50 p-6 space-y-3 mb-8">
        <h2 className="text-lg font-semibold text-slate-900">Privacy</h2>
        <p className="text-sm text-slate-600">
          We only collect what's needed to provide the service. Company data comes from the public Companies House register.
          We do not sell or share your personal information.
        </p>
      </div>

      <div id="support" className="rounded-xl border bg-slate-50 p-6 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Support</h2>
        <p className="text-sm text-slate-600">
          Questions? Issues? We respond within one business day. Contact us at{' '}
          <a href="mailto:support@fineguardpro.com" className="text-blue-600 hover:underline">
            support@fineguardpro.com
          </a>
        </p>
      </div>
    </PageContainer>
  );
}
