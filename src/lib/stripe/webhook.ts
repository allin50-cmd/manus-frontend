import type Stripe from 'stripe';
import { handleStripeWebhookEvent } from '@/server/services/billing/stripe-webhook.service';

export async function handleWebhookEvent(event: Stripe.Event): Promise<{
  processed: boolean;
  deduplicated: boolean;
}> {
  return handleStripeWebhookEvent(event);
}
