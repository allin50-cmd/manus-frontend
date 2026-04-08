import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'placeholder', {
  apiVersion: '2023-10-16',
});

export function assertStripeKey() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
}

export const STRIPE_PRICE_IDS = {
  accountsFiling: process.env.STRIPE_PRICE_ACCOUNTS_FILING ?? '',
  confirmationStatement: process.env.STRIPE_PRICE_CONFIRMATION_STATEMENT ?? '',
  strikeOff: process.env.STRIPE_PRICE_STRIKE_OFF ?? '',
} as const;

export type FineGuardProductKey = keyof typeof STRIPE_PRICE_IDS;

export function getStripePriceId(product: FineGuardProductKey): string {
  const id = STRIPE_PRICE_IDS[product];
  if (!id) throw new Error(`Stripe price ID not set for product: ${product}`);
  return id;
}
