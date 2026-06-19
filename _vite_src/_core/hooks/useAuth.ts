import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';

export interface AuthUser {
  id: string;
  email: string;
  onboardingCompleted: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { data } = trpc.auth.me.useQuery();

  useEffect(() => {
    if (data) {
      setUser(data as AuthUser);
      setLoading(false);
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [data]);

  return { user, loading };
}
