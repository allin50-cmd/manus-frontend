'use client';

import { useEffect, useState } from 'react';
import { getPlan, type PlanLimits } from '@/lib/plans';

export function useSubscription() {
  const [plan, setPlan] = useState<PlanLimits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => setPlan(getPlan(data?.tenant?.plan)))
      .catch(() => setPlan(getPlan('free')))
      .finally(() => setLoading(false));
  }, []);

  return { plan, loading };
}
