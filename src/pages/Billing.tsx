import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import BillingDashboard from '../components/billing/BillingDashboard';
import { CreditCard } from 'lucide-react';

export default function Billing() {
  usePageTitle('Billing');
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) setLocation('/login');
  }, [loading, isAuthenticated, setLocation]);

  if (loading || !isAuthenticated) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[#5A4BFF]/15 border border-[#5A4BFF]/30 flex items-center justify-center">
          <CreditCard className="w-6 h-6 text-[#5A4BFF]" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white">Billing</h1>
          <p className="text-slate-400 text-sm">Manage your subscription and payment method</p>
        </div>
      </div>
      <BillingDashboard />
    </div>
  );
}
