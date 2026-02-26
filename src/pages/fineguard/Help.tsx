import { BookOpen, MessageCircle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { AppLayout } from '@/components/fineguard/AppLayout';
import { CardGrid } from '@/components/fineguard/CardGrid';
import { Card } from '@/components/fineguard/Card';

const FAQS = [
  {
    q: 'What Microsoft 365 licences does FineGuard require?',
    a: 'FineGuard requires at minimum Microsoft 365 Business Basic for SharePoint and Teams access. An Azure subscription is needed for the Azure Functions component.',
  },
  {
    q: 'Does FineGuard store data outside our Microsoft 365 tenant?',
    a: 'No. All data is stored within your own Microsoft 365 tenant using SharePoint lists and Cosmos DB provisioned inside your Azure subscription. FineGuard does not use external databases or third-party storage.',
  },
  {
    q: 'How long does deployment take?',
    a: 'A typical deployment completes in under an hour using the Installer Portal. Larger tenants with complex SharePoint configurations may take slightly longer.',
  },
  {
    q: 'Which UK statutory deadlines does FineGuard track?',
    a: 'FineGuard tracks Companies House confirmation statements, annual accounts, corporation tax returns, VAT filing windows, PAYE/NI deadlines, and MTD ITSA submission dates.',
  },
  {
    q: 'Is FineGuard MTD-ready?',
    a: 'Yes. FineGuard maintains the digital records, automation, and audit trail required for Making Tax Digital for Income Tax Self Assessment (MTD ITSA).',
  },
  {
    q: 'How do I add a new tenant?',
    a: 'Navigate to Deploy in the sidebar, fill in the tenant details and domain configuration, and click Deploy. The installer will provision all required resources automatically.',
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        className="flex w-full items-start justify-between py-4 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-sm font-medium text-gray-900 pr-6">{q}</span>
        {open
          ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
          : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />}
      </button>
      {open && <p className="pb-4 text-sm text-gray-500 leading-relaxed">{a}</p>}
    </div>
  );
}

export default function Help() {
  return (
    <AppLayout title="Help & Documentation">
      <div className="max-w-3xl space-y-6">
        {/* Quick links */}
        <CardGrid cols={2}>
          <Card
            icon={<BookOpen className="h-5 w-5" />}
            title="Documentation"
            description="Guides, API reference, and deployment walkthroughs."
          >
            <a
              href="https://fineguard.co.uk/docs"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand-gold hover:underline"
            >
              Open docs <ExternalLink className="h-3 w-3" />
            </a>
          </Card>
          <Card
            icon={<MessageCircle className="h-5 w-5" />}
            title="Contact Support"
            description="Raise a support ticket or email our team directly."
          >
            <a
              href="mailto:info@fineguard.co.uk"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand-gold hover:underline"
            >
              info@fineguard.co.uk
            </a>
          </Card>
        </CardGrid>

        {/* FAQs */}
        <div className="rounded-xl border border-gray-200 bg-white px-5">
          <p className="py-4 text-sm font-semibold text-gray-900">Frequently Asked Questions</p>
          {FAQS.map((faq) => <FaqItem key={faq.q} q={faq.q} a={faq.a} />)}
        </div>

        {/* Getting started */}
        <div className="rounded-xl border border-brand-gold/30 bg-brand-navy p-6">
          <p className="text-sm font-semibold text-white mb-3">Getting Started</p>
          <ol className="space-y-2 text-sm text-slate-300 list-decimal list-inside">
            <li>Configure your default domains under <strong className="text-white">Settings → Domains</strong>.</li>
            <li>Optionally enable Copilot under <strong className="text-white">Settings → Copilot</strong>.</li>
            <li>Navigate to <strong className="text-white">Deploy</strong> and enter tenant details.</li>
            <li>Click <strong className="text-white">Deploy FineGuard</strong> and monitor the live log.</li>
            <li>Review completed deployments under <strong className="text-white">History</strong>.</li>
          </ol>
        </div>
      </div>
    </AppLayout>
  );
}
