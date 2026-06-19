export interface OnboardingState {
  companyNumber?: string;
  paidAt?: number;
  lastStep?: string;
}

export function stepToPath(step?: string): string {
  const steps: { [key: string]: string } = {
    'welcome': '/onboarding',
    'company': '/onboarding/company',
    'alerts': '/onboarding/alerts',
    'notifications': '/onboarding/notifications',
    'complete': '/onboarding/complete',
  };
  return steps[step ?? 'welcome'] ?? '/onboarding';
}

export function useOnboardingState() {
  const get = (): OnboardingState | null => {
    try {
      const raw = sessionStorage.getItem('fg_onboarding');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const set = (state: OnboardingState) => {
    sessionStorage.setItem('fg_onboarding', JSON.stringify(state));
  };

  const clear = () => {
    sessionStorage.removeItem('fg_onboarding');
  };

  return { get, set, clear };
}
