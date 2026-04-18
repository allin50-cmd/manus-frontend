'use client';

import { useEffect, useState } from 'react';

export function useCompanyCount() {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    fetch('/api/companies')
      .then((r) => r.json())
      .then((data) => setCount((data?.companies ?? []).length))
      .catch(() => setCount(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  return { count, loading, refresh };
}
