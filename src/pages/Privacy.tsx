import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { usePageTitle } from '../hooks/usePageTitle';

const sections = [
  {
    title: '1. Information We Collect',
    content: `We collect information you provide directly to us, including: name, email address, company details, and payment information when you register for an account or subscribe to our services.

We also automatically collect certain information when you use our platform, including your IP address, browser type, operating system, and usage data about how you interact with FineGuard.

For compliance monitoring purposes, we access publicly available data from Companies House on your behalf.`,
  },
  {
    title: '2. How We Use Your Information',
    content: `We use the information we collect to:
- Provide, maintain, and improve our compliance monitoring services
- Send you alerts about Companies House filing deadlines and compliance events
- Process your subscription payments
- Send you technical notices, updates, and support messages
- Respond to your comments, questions, and customer service requests
- Monitor and analyse trends, usage, and activities in connection with our services`,
  },
  {
    title: '3. Data Sharing and Disclosure',
    content: `We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
- With your consent or at your direction
- With service providers who need access to perform services on our behalf (payment processing, email delivery)
- If required by law, regulation, legal process, or governmental request
- To protect the rights, property, and safety of FineGuard, our users, or the public`,
  },
  {
    title: '4. Data Security',
    content: `We implement industry-standard security measures to protect your personal information:
- All data is encrypted at rest using AES-256 encryption
- All data in transit is protected using TLS 1.3
- Access controls and authentication for all internal systems
- Regular security audits and penetration testing
- SOC 2 Type II compliance`,
  },
  {
    title: '5. Data Retention',
    content: `We retain your personal information for as long as your account is active or as needed to provide you services. If you wish to cancel your account or request that we delete your information, please contact us at privacy@fineguard.co.uk. We will retain and use your information as necessary to comply with our legal obligations, resolve disputes, and enforce our agreements.`,
  },
  {
    title: '6. Your Rights (GDPR)',
    content: `Under the UK GDPR, you have the right to:
- Access the personal data we hold about you
- Rectify inaccurate personal data
- Request erasure of your personal data
- Restrict processing of your personal data
- Data portability — receive your data in a structured, commonly used format
- Object to processing of your personal data
- Withdraw consent at any time

To exercise any of these rights, contact our Data Protection Officer at dpo@fineguard.co.uk.`,
  },
  {
    title: '7. Cookies',
    content: `We use essential cookies to maintain your session and preferences. We do not use third-party advertising cookies. Analytics cookies are only used with your explicit consent and can be managed through your browser settings.`,
  },
  {
    title: '8. Changes to This Policy',
    content: `We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date. Material changes will be communicated via email to registered users.`,
  },
  {
    title: '9. Contact Us',
    content: `If you have questions about this Privacy Policy, please contact us:
- Email: privacy@fineguard.co.uk
- Post: FineGuard Ltd, 71-75 Shelton Street, Covent Garden, London WC2H 9JQ
- Data Protection Officer: dpo@fineguard.co.uk
- ICO Registration Number: ZB123456`,
  },
];

export default function Privacy() {
  usePageTitle('Privacy Policy');
  return (
    <div className="min-h-screen">
      <section className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-[#5A4BFF]" />
            <h1 className="text-3xl sm:text-4xl font-black text-white">Privacy Policy</h1>
          </div>
          <p className="text-sm text-slate-400 mb-12">Last Updated: 1 January 2026 | Effective Date: 1 January 2026</p>

          <div className="prose prose-invert max-w-none space-y-10">
            <p className="text-lg text-slate-300 leading-relaxed">
              FineGuard Ltd ("we", "our", "us") is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal information when you use our compliance monitoring platform.
            </p>

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
