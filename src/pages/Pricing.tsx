import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';

const PLANS = [
  {
    name: 'Free',
    price: '£0',
    period: '/month',
    desc: 'Try the entry tools',
    features: [
      'Access to £1 VAT Pre-Submission Checker',
      'Access to £1 Companies House Deadline Scanner',
      'Up to 5 companies in dashboard',
      'Basic compliance status view',
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
      'Full Compliance Dashboard with risk indicators',
      'Compliance Timeline per company',
      'Automated daily monitoring engine',
      'Alerts via email, Slack & Microsoft Teams',
      '7-Year Document Vault (AES-256 encrypted)',
      'Client compliance report generator',
      'Priority email & phone support'
    ],
    cta: 'Start 14-Day Free Trial',
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
      'Multi-firm management console',
      'FineGuard Compliance API access',
      'White-labelling options',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantee (99.9%)',
      'Custom data retention periods',
      'On-premise deployment available'
    ],
    cta: 'Contact Sales',
    href: 'mailto:sales@fineguard.pro',
    highlighted: false
  }
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-14">
          <Badge className="bg-[#C9A64A]/10 text-[#C9A64A] border-[#C9A64A]/20 mb-4">Transparent Pricing</Badge>
          <h1 className="text-4xl font-bold text-[#1A1A1A] mb-4">Simple Plans for Every Firm</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Start free with pay-per-use tools. Upgrade to Pro for full automated monitoring and compliance management.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 relative ${
                plan.highlighted
                  ? 'bg-[#1A1A1A] text-white border-2 border-[#C9A64A]'
                  : 'bg-white border border-gray-200'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-[#C9A64A] text-white px-4 py-1 shadow-lg">Most Popular</Badge>
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
                  {plan.period && (
                    <span className={`text-sm ${plan.highlighted ? 'text-gray-300' : 'text-gray-500'}`}>{plan.period}</span>
                  )}
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
                  {plan.highlighted && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* Pay per use section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Pay-Per-Use Entry Tools</h2>
            <p className="text-gray-600">No subscription required. Pay £1 per use with Stripe.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 p-4 bg-[#F8F8F8] rounded-xl">
              <div className="p-2 bg-[#C9A64A]/10 rounded-lg">
                <Shield className="w-6 h-6 text-[#C9A64A]" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-[#1A1A1A]">VAT Pre-Submission Checker</h3>
                  <Badge className="bg-[#C9A64A] text-white text-xs">£1</Badge>
                </div>
                <p className="text-sm text-gray-600">Validate all 9 VAT boxes before submission to HMRC.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-[#F8F8F8] rounded-xl">
              <div className="p-2 bg-[#1A1A1A]/10 rounded-lg">
                <Shield className="w-6 h-6 text-[#1A1A1A]" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-[#1A1A1A]">Companies House Deadline Scanner</h3>
                  <Badge className="bg-[#1A1A1A] text-white text-xs">£1</Badge>
                </div>
                <p className="text-sm text-gray-600">Bulk scan company deadlines via CSV upload.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
