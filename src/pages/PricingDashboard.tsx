import { useState } from 'react';
import {
  CheckCircle, Building2, Users, TrendingUp, Zap,
  Shield, Star, Calculator, ArrowRight
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { formatCurrency, cn } from '@/lib/utils';

interface PricingTier {
  id: string;
  name: string;
  price: number;
  interval: 'month';
  companies: number | 'unlimited';
  description: string;
  features: string[];
  highlight?: boolean;
  badge?: string;
  color: string;
  bgColor: string;
}

const TIERS: PricingTier[] = [
  {
    id: 'solo',
    name: 'Solo Accountant',
    price: 29,
    interval: 'month',
    companies: 10,
    description: 'Perfect for sole practitioners and bookkeepers',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    features: [
      '10 companies',
      'MTD VAT submissions',
      'Receipt scanner (mobile)',
      'Companies House lookup',
      'Compliance alerts',
      'Document vault (5GB)',
      'Email support',
    ],
  },
  {
    id: 'professional',
    name: 'Professional Firm',
    price: 99,
    interval: 'month',
    companies: 50,
    description: 'For growing practices managing multiple clients',
    highlight: true,
    badge: 'Most Popular',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    features: [
      '50 companies',
      'Everything in Solo',
      'Bulk CSV/Excel import',
      'Bank reconciliation',
      'Audit trail',
      '1p variance protection',
      'Document vault (50GB)',
      'Priority email support',
      'API access',
    ],
  },
  {
    id: 'practice',
    name: 'Practice Pro',
    price: 299,
    interval: 'month',
    companies: 250,
    description: 'For established practices with large client bases',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    features: [
      '250 companies',
      'Everything in Professional',
      'Multi-user roles (partner, senior, accountant)',
      'White-label client portal',
      'Automated compliance monitoring',
      'HMRC agent integration',
      'Document vault (200GB)',
      'Phone + email support',
      'Custom integrations',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 999,
    interval: 'month',
    companies: 'unlimited',
    description: 'For large practices and national firms',
    badge: 'Best Value',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    features: [
      'Unlimited companies',
      'Everything in Practice Pro',
      'Dedicated account manager',
      'SLA guarantee (99.9% uptime)',
      'Custom audit reports',
      'SSO / SAML integration',
      'Unlimited document vault',
      'On-boarding assistance',
      'Custom contract & invoicing',
    ],
  },
];

const ADD_ONS = [
  { name: 'Receipt AI Processing', price: 10, unit: '1,000 receipts', icon: Zap, description: 'OCR + field extraction at scale' },
  { name: 'VAT Health Reports', price: 5, unit: 'report', icon: Shield, description: 'Per-company compliance score with recommendations' },
  { name: 'Compliance Monitoring', price: 2, unit: 'company/month', icon: Building2, description: 'Automated deadline tracking & alerts' },
];

export default function PricingDashboard() {
  const [firms, setFirms] = useState(500);
  const [avgPrice, setAvgPrice] = useState(199);
  const [showAdminView, setShowAdminView] = useState(true);

  const monthlyRevenue = firms * avgPrice;
  const annualRevenue = monthlyRevenue * 12;
  const targetFirms = 4000;
  const targetARR = targetFirms * avgPrice * 12;

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="FineGuard Pricing"
        description="Compliance-as-a-Service — scalable pricing for accountants and SME directors"
        actions={
          <button
            onClick={() => setShowAdminView(p => !p)}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <Calculator className="w-3.5 h-3.5" />
            {showAdminView ? 'Hide ARR Model' : 'Show ARR Model'}
          </button>
        }
      />

      {/* ARR Model */}
      {showAdminView && (
        <div className="card mb-8 p-5 bg-gradient-to-r from-gray-900 to-blue-900 text-white">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-300" />
            <h2 className="font-bold text-white">£10M ARR Revenue Model</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-blue-200">Active accounting firms</label>
                  <span className="font-mono font-bold text-white">{firms.toLocaleString()}</span>
                </div>
                <input
                  type="range" min={100} max={5000} step={100} value={firms}
                  onChange={e => setFirms(parseInt(e.target.value))}
                  className="w-full accent-blue-400"
                />
                <div className="flex justify-between text-xs text-blue-400 mt-1">
                  <span>100</span><span>5,000</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-blue-200">Average subscription (£/month)</label>
                  <span className="font-mono font-bold text-white">£{avgPrice}</span>
                </div>
                <input
                  type="range" min={29} max={999} step={10} value={avgPrice}
                  onChange={e => setAvgPrice(parseInt(e.target.value))}
                  className="w-full accent-blue-400"
                />
                <div className="flex justify-between text-xs text-blue-400 mt-1">
                  <span>£29</span><span>£999</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Monthly Revenue', value: `£${(monthlyRevenue / 1000).toFixed(0)}k`, color: 'text-blue-300' },
                { label: 'Annual Revenue (ARR)', value: `£${(annualRevenue / 1_000_000).toFixed(2)}M`, color: 'text-green-300' },
                { label: 'Scale to 4,000 firms', value: `£${(targetARR / 1_000_000).toFixed(1)}M ARR`, color: 'text-amber-300' },
                { label: 'Per firm margin est.', value: '~75%', color: 'text-purple-300' },
              ].map(item => (
                <div key={item.label} className="bg-white/10 rounded-lg p-3">
                  <p className="text-xs text-blue-200">{item.label}</p>
                  <p className={cn('text-xl font-bold font-mono mt-1', item.color)}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 p-3 bg-white/10 rounded-lg">
            <p className="text-xs text-blue-200">
              <strong className="text-white">Path to £10M ARR:</strong> At an average of £199/month per firm,
              reaching <strong className="text-white">4,176 accounting firms</strong> achieves £10M ARR.
              Each firm brings an average of 25–50 companies. The unit economics improve dramatically at scale
              as infrastructure costs remain largely fixed.
            </p>
          </div>
        </div>
      )}

      {/* Market Position */}
      <div className="card mb-8 p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Compliance Firewall</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                FineGuard doesn't replace Xero or QuickBooks. We protect accountants from the compliance
                mistakes those platforms let through.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Accountant-Led Growth</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Each accountant brings 50–500 companies. One firm sale generates the revenue of
                hundreds of individual B2C subscriptions.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">MTD Mandate Tailwind</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                HMRC's Making Tax Digital expansion creates mandatory demand. Every UK business
                with turnover above £30k will require MTD-compliant software.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {TIERS.map(tier => (
          <PricingCard key={tier.id} tier={tier} />
        ))}
      </div>

      {/* Add-ons */}
      <div className="card p-5 mb-8">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Add-On Revenue Streams</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ADD_ONS.map(addon => (
            <div key={addon.name} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <addon.icon className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{addon.name}</p>
                  <p className="text-xs text-gray-400">{addon.description}</p>
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">£{addon.price}</span>
                <span className="text-xs text-gray-400">per {addon.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sales Funnel */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Free-to-Paid Conversion Funnel</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              step: '1',
              title: 'Free VAT Pre-Check',
              description: 'Accountant pastes their VAT box numbers. FineGuard validates in 10 seconds.',
              cta: 'No sign-up required',
              color: 'border-gray-200',
            },
            {
              step: '2',
              title: 'Show the Problem',
              description: '"Potential VAT discrepancy detected — variance of £0.01 between Box 1 and your ledger total."',
              cta: 'Creates fear/urgency',
              color: 'border-amber-200',
            },
            {
              step: '3',
              title: 'Convert to Paid',
              description: '"Upgrade to FineGuard to monitor all your clients automatically — from £29/month."',
              cta: 'Upgrade flow',
              color: 'border-blue-200',
            },
          ].map(stage => (
            <div key={stage.step} className={cn('border-2 rounded-lg p-4', stage.color)}>
              <div className="w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold mb-3">
                {stage.step}
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{stage.title}</h3>
              <p className="text-xs text-gray-500 mb-3">{stage.description}</p>
              <span className="text-xs font-medium text-blue-600 flex items-center gap-1">
                <ArrowRight className="w-3 h-3" /> {stage.cta}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PricingCard({ tier }: { tier: PricingTier }) {
  return (
    <div className={cn(
      'card flex flex-col',
      tier.highlight && 'ring-2 ring-blue-600 shadow-lg'
    )}>
      {tier.badge && (
        <div className="bg-blue-600 text-white text-xs font-bold text-center py-1.5 rounded-t-lg -mx-px -mt-px">
          {tier.badge}
        </div>
      )}
      <div className="p-5 flex flex-col flex-1">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', tier.bgColor)}>
          <Building2 className={cn('w-5 h-5', tier.color)} />
        </div>

        <h3 className="font-bold text-gray-900">{tier.name}</h3>
        <p className="text-xs text-gray-400 mt-0.5 mb-4">{tier.description}</p>

        <div className="mb-4">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900">£{tier.price}</span>
            <span className="text-sm text-gray-400">/ month</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {tier.companies === 'unlimited' ? 'Unlimited companies' : `Up to ${tier.companies} companies`}
          </p>
        </div>

        <div className="space-y-2 mb-6 flex-1">
          {tier.features.map(feature => (
            <div key={feature} className="flex items-start gap-2">
              <CheckCircle className={cn('w-4 h-4 flex-shrink-0 mt-0.5', tier.color)} />
              <span className="text-xs text-gray-600">{feature}</span>
            </div>
          ))}
        </div>

        <button className={cn(
          'w-full py-2.5 text-sm font-semibold rounded-lg transition-all',
          tier.highlight
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
        )}>
          Get Started
        </button>
      </div>
    </div>
  );
}
