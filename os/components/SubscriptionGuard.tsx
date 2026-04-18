'use client';

import Link from 'next/link';
import type { PlanId } from '@/lib/plans';
import { PLAN_LIMITS } from '@/lib/plans';
import { useSubscription } from '@/hooks/useSubscription';

interface SubscriptionGuardProps {
  requires: PlanId;
  feature?: string;
  children: React.ReactNode;
}

export function SubscriptionGuard({ requires, feature, children }: SubscriptionGuardProps) {
  const { plan, loading } = useSubscription();

  if (loading) return null;

  const order: PlanId[] = ['free', 'pro', 'enterprise'];
  const currentIdx = order.indexOf(plan?.id ?? 'free');
  const requiredIdx = order.indexOf(requires);

  if (currentIdx >= requiredIdx) return <>{children}</>;

  const requiredPlan = PLAN_LIMITS[requires];

  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-center">
      <p className="text-sm font-medium text-gray-800">
        {feature ? `${feature} requires` : 'This feature requires'}{' '}
        <strong>{requiredPlan.label}</strong>
        {requiredPlan.priceGBP > 0 ? ` (£${requiredPlan.priceGBP}/mo)` : ''}.
      </p>
      <Link
        href="/pricing"
        className="mt-3 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
      >
        Upgrade plan
      </Link>
    </div>
  );
}
