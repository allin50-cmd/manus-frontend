import { stripe } from './client';
import { config } from '@/config';
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

export interface CreateCheckoutSessionInput {
  companyNumber: string;
  companyName: string;
  selectedServices: AlertType[];
  tenantId?: string;
  fgRef?: string;
  customerEmail?: string;
}

export async function createCheckoutSession(input: CreateCheckoutSessionInput) {
  const appUrl = config.publicAppUrl;

  const metadata: Record<string, string> = {
    company_number: input.companyNumber,
    company_name: input.companyName,
    alert_types: input.selectedServices.join(','),
    source: 'check_page',
    ...(input.tenantId ? { tenant_id: input.tenantId } : {}),
    ...(input.fgRef ? { fg_ref: input.fgRef } : {}),
  };

  return stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: buildLineItems(input.selectedServices),
    // client_reference_id is set programmatically and cannot be edited via the
    // Stripe dashboard — more trustworthy than metadata for the company key.
    client_reference_id: input.companyNumber,
    metadata,
    ...(input.customerEmail ? { customer_email: input.customerEmail } : {}),
    success_url: `${appUrl}/check?activated=1&session_id={CHECKOUT_SESSION_ID}&company=${encodeURIComponent(input.companyNumber)}`,
    cancel_url: `${appUrl}/check?q=${encodeURIComponent(input.companyNumber)}`,
  });
}
