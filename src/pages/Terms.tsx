import { FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { usePageTitle } from '../hooks/usePageTitle';

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing or using FineGuard's compliance monitoring platform ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not access or use the Service. These terms apply to all visitors, users, and subscribers.`,
  },
  {
    title: '2. Description of Service',
    content: `FineGuard provides automated compliance monitoring for UK limited companies registered with Companies House. Our Service includes:
- Real-time monitoring of filing deadlines and compliance events
- Automated alerts for overdue or upcoming filings
- Company compliance dashboards and reporting
- Companies House data lookup and analysis
- Integration with VaultLine Cloud and UltAi Intake products`,
  },
  {
    title: '3. Account Registration',
    content: `To use certain features of the Service, you must register for an account. You agree to:
- Provide accurate, current, and complete registration information
- Maintain the security of your password and account
- Promptly update your account information if it changes
- Accept responsibility for all activities under your account
- Notify us immediately of any unauthorised use of your account`,
  },
  {
    title: '4. Subscription and Payments',
    content: `Paid subscriptions are billed monthly or annually as selected. Prices are in GBP and exclusive of VAT where applicable. Free trial periods, if offered, will be clearly communicated. You may cancel your subscription at any time, and cancellation takes effect at the end of the current billing period. Refunds are provided on a pro-rata basis for annual plans cancelled within the first 30 days.`,
  },
  {
    title: '5. Acceptable Use',
    content: `You agree not to:
- Use the Service for any unlawful purpose
- Attempt to gain unauthorised access to any part of the Service
- Interfere with or disrupt the Service or its infrastructure
- Use automated tools to scrape or extract data beyond normal use
- Resell or redistribute the Service without authorisation
- Use the Service to harass, abuse, or harm others`,
  },
  {
    title: '6. Data Accuracy Disclaimer',
    content: `FineGuard retrieves data from Companies House and other public sources. While we strive for accuracy, we cannot guarantee that all information is complete, current, or error-free. The Service is provided as a monitoring aid and should not be treated as legal or professional advice. Users should verify critical compliance information directly with Companies House or their professional advisors.`,
  },
  {
    title: '7. Intellectual Property',
    content: `The Service, including its design, features, content, and technology, is owned by FineGuard Ltd and protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works based on the Service without our written consent. Your use of the Service does not transfer any ownership rights.`,
  },
  {
    title: '8. Limitation of Liability',
    content: `To the maximum extent permitted by law, FineGuard shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business opportunities, arising from your use of the Service. Our total liability shall not exceed the amount you paid for the Service in the 12 months preceding the claim.`,
  },
  {
    title: '9. Termination',
    content: `We may suspend or terminate your access to the Service at any time for violation of these Terms. Upon termination, your right to use the Service ceases immediately. You may export your data within 30 days of termination by contacting support. Provisions that by their nature should survive termination shall remain in effect.`,
  },
  {
    title: '10. Governing Law',
    content: `These Terms shall be governed by the laws of England and Wales. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.`,
  },
  {
    title: '11. Contact',
    content: `For questions about these Terms:
- Email: legal@fineguard.co.uk
- Post: FineGuard Ltd, 71-75 Shelton Street, Covent Garden, London WC2H 9JQ`,
  },
];

export default function Terms() {
  usePageTitle('Terms of Service');
  return (
    <div className="min-h-screen">
      <section className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-8 h-8 text-[#5A4BFF]" />
            <h1 className="text-3xl sm:text-4xl font-black text-white">Terms of Service</h1>
          </div>
          <p className="text-sm text-slate-400 mb-12">Last Updated: 1 January 2026 | Effective Date: 1 January 2026</p>

          <div className="prose prose-invert max-w-none space-y-10">
            {sections.map((s) => (
              <div key={s.title}>
                <h2 className="text-xl font-bold text-white mb-3">{s.title}</h2>
                <div className="text-slate-400 leading-relaxed whitespace-pre-line text-sm">{s.content}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
