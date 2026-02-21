import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, AlertTriangle, ExternalLink, Loader2, Building2, FileText, Calculator, Receipt, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

interface Subscription {
  id: string;
  services: string;
  status: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  companyCount?: number;
}

const AVAILABLE_SERVICES = [
  { key: 'companies_house', name: 'Companies House', icon: Building2, features: ['Annual return deadlines', 'Accounts filing dates', 'Director changes'] },
  { key: 'corporate_tax', name: 'Corporate Tax', icon: FileText, features: ['Corporation tax returns', 'Payment deadlines', 'HMRC compliance'] },
  { key: 'self_assessment', name: 'Self Assessment', icon: Calculator, features: ['Tax return deadlines', 'Payment due dates', 'Quarterly reminders'] },
  { key: 'vat_returns', name: 'VAT Returns', icon: Receipt, features: ['VAT return deadlines', 'Payment schedules', 'MTD compliance'] },
];

export default function BillingDashboard() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [activeServices, setActiveServices] = useState<string[]>([]);
  const [companyCount, setCompanyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast.success('Services updated successfully!');
      window.history.replaceState({}, '', '/billing');
      fetchSubscription();
    } else if (params.get('canceled') === 'true') {
      toast.info('Checkout canceled.');
      window.history.replaceState({}, '', '/billing');
    }
  }, []);

  const fetchSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/billing/subscription', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) {
        setSubscription(data.subscription);
        const services = data.services || (data.subscription?.services ? data.subscription.services.split(',').filter(Boolean) : []);
        setActiveServices(services);
        setCompanyCount(data.companyCount || data.subscription?.companyCount || 0);
      }
    } catch {
      toast.error('Failed to load billing info');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleService = async (serviceKey: string) => {
    setToggling(serviceKey);
    try {
      const token = localStorage.getItem('token');
      const isActive = activeServices.includes(serviceKey);
      const res = await fetch('/api/billing/toggle-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ service: serviceKey, action: isActive ? 'remove' : 'add' }),
      });
      const data = await res.json();
      if (data.ok || data.demo) {
        if (isActive) {
          setActiveServices((prev) => prev.filter((s) => s !== serviceKey));
          toast.success(`Removed ${AVAILABLE_SERVICES.find((s) => s.key === serviceKey)?.name}`);
        } else {
          setActiveServices((prev) => [...prev, serviceKey]);
          toast.success(`Added ${AVAILABLE_SERVICES.find((s) => s.key === serviceKey)?.name}`);
        }
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        toast.error(data.error || 'Failed to update service');
      }
    } catch {
      toast.error('Failed to update service');
    } finally {
      setToggling(null);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.demo) {
        toast.info(data.message);
      } else if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Failed to open billing portal');
      }
    } catch {
      toast.error('Failed to open billing portal');
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#5A4BFF] animate-spin" />
      </div>
    );
  }

  const monthlyCost = activeServices.length * Math.max(companyCount, 1);

  return (
    <div className="space-y-8">
      {/* Summary Card */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-black text-white">Your Services</h2>
            <p className="text-slate-400 text-sm mt-1">
              {activeServices.length === 0
                ? 'No services active yet — add services below'
                : `${activeServices.length} service${activeServices.length !== 1 ? 's' : ''} active across ${companyCount} compan${companyCount !== 1 ? 'ies' : 'y'}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {subscription?.status === 'active' && activeServices.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-bold uppercase tracking-wide">
                <CheckCircle className="w-3.5 h-3.5" /> Active
              </span>
            )}
            {subscription?.status === 'past_due' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wide">
                <AlertTriangle className="w-3.5 h-3.5" /> Past Due
              </span>
            )}
          </div>
        </div>

        {activeServices.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Estimated monthly cost</span>
              <span className="text-white font-bold text-lg">
                £{monthlyCost}<span className="text-slate-500 text-sm font-normal">/month</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {activeServices.length} service{activeServices.length !== 1 ? 's' : ''} × {Math.max(companyCount, 1)} compan{Math.max(companyCount, 1) !== 1 ? 'ies' : 'y'} × £1
            </p>
          </div>
        )}

        {subscription?.currentPeriodEnd && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">
                {subscription.cancelAtPeriodEnd ? 'Access until' : 'Next billing date'}
              </span>
              <span className="text-white font-medium">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        )}

        {activeServices.length > 0 && (
          <div className="mt-6">
            <button
              onClick={handleManageBilling}
              disabled={portalLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/15 transition-colors disabled:opacity-50"
            >
              {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
              Manage Billing
            </button>
          </div>
        )}
      </div>

      {/* Service Cards */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Alert Services</h3>
        <p className="text-sm text-slate-400 mb-6">£1 per month per company for each service.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {AVAILABLE_SERVICES.map((service) => {
            const isActive = activeServices.includes(service.key);
            const SIcon = service.icon;
            return (
              <div
                key={service.key}
                className={`relative rounded-2xl p-6 border transition-all ${
                  isActive
                    ? 'bg-[#5A4BFF]/10 border-[#5A4BFF]/40'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-[#5A4BFF]/20' : 'bg-white/5'}`}>
                    <SIcon className={`w-5 h-5 ${isActive ? 'text-[#5A4BFF]' : 'text-slate-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-bold text-white">{service.name}</h4>
                    <p className="text-sm text-slate-400 mt-0.5">£1/mo per company</p>
                    <ul className="mt-2 space-y-1">
                      {service.features.map((f) => (
                        <li key={f} className="text-xs text-slate-500 flex items-center gap-1.5">
                          <span className="text-[#5A4BFF]">•</span> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    onClick={() => handleToggleService(service.key)}
                    disabled={toggling === service.key}
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25'
                        : 'bg-[#5A4BFF] text-white hover:bg-[#6B5BFF]'
                    }`}
                  >
                    {toggling === service.key ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isActive ? (
                      <Minus className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="w-5 h-5 text-slate-400" />
          <h3 className="text-lg font-bold text-white">Payment Method</h3>
        </div>
        {activeServices.length === 0 ? (
          <p className="text-sm text-slate-400">No payment method on file. Add one when you activate a service.</p>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Managed through Stripe</p>
            <button
              onClick={handleManageBilling}
              className="text-sm text-[#5A4BFF] hover:underline font-medium"
            >
              Update payment method
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
