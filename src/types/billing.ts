import type { AlertType } from './alerts';

export interface ServiceSelection {
  type: AlertType;
  selected: boolean;
  pricePerMonth: number; // in pence
}

export const SERVICES: ServiceSelection[] = [
  { type: 'accounts_filing', selected: false, pricePerMonth: 100 },
  { type: 'confirmation_statement', selected: false, pricePerMonth: 100 },
  { type: 'strike_off', selected: false, pricePerMonth: 100 },
];

export interface CheckoutState {
  status: 'idle' | 'loading' | 'success' | 'error';
  sessionUrl?: string;
  error?: string;
}

export interface PricingPlan {
  name: string;
  priceMonthly: number;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
}
