import type { AlertType } from '@/types/alerts';

const PRICE_IDS: Record<AlertType, string | undefined> = {
  accounts_filing: process.env.STRIPE_PRICE_ACCOUNTS_FILING,
  confirmation_statement: process.env.STRIPE_PRICE_CONFIRMATION_STATEMENT,
  strike_off: process.env.STRIPE_PRICE_STRIKE_OFF,
};

export function getPriceId(alertType: AlertType): string {
  const id = PRICE_IDS[alertType];
  if (!id) throw new Error(`STRIPE_PRICE_${alertType.toUpperCase()} env var not set`);
  return id;
}

export function buildLineItems(selectedServices: AlertType[]) {
  return selectedServices.map((type) => ({
    price: getPriceId(type),
    quantity: 1,
  }));
}
