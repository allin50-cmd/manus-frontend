/**
 * Stripe Connect client
 *
 * A single Stripe instance used for ALL Connect operations — both V1 and V2
 * API surfaces.  V2 routes (v2.core.accounts, v2.core.events, etc.) are only
 * available on this client, not on the main `stripe` export in client.ts.
 */

import Stripe from 'stripe';

/**
 * The platform Stripe client.
 * Use this for all Stripe API calls — V1 and V2.
 *
 * V1 example (products on a connected account):
 *   stripeClient.products.create({ ... }, { stripeAccount: 'acct_...' })
 *
 * V2 example (create a connected account):
 *   stripeClient.v2.core.accounts.create({ ... })
 */
export const stripeClient = new Stripe(
  process.env.STRIPE_SECRET_KEY ?? 'placeholder',
);

/**
 * The webhook secret used to verify incoming events from Stripe.
 * PLACEHOLDER: Set STRIPE_CONNECT_WEBHOOK_SECRET in your environment.
 * Use a separate secret for Connect webhooks (vs. your main webhook secret).
 */
export const connectWebhookSecret =
  process.env.STRIPE_CONNECT_WEBHOOK_SECRET ?? '';

/**
 * The webhook secret for standard (V1) subscription events.
 * PLACEHOLDER: Set STRIPE_SUBSCRIPTION_WEBHOOK_SECRET in your environment.
 * (Uses a separate secret so it can be registered as its own endpoint.)
 */
export const subscriptionWebhookSecret =
  process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET ?? '';

/**
 * The Stripe price ID used for the platform subscription sold to
 * connected accounts.
 * PLACEHOLDER: Set STRIPE_CONNECT_SUBSCRIPTION_PRICE_ID or replace with
 * a hardcoded price_*** value from your Stripe dashboard.
 */
export const platformSubscriptionPriceId =
  process.env.STRIPE_CONNECT_SUBSCRIPTION_PRICE_ID ??
  // TODO: replace this placeholder with a real price_*** ID from
  // https://dashboard.stripe.com/products
  'price_PLACEHOLDER';

/**
 * Application fee taken on each direct charge to a connected account.
 * Expressed in the smallest currency unit (e.g. pence for GBP).
 * PLACEHOLDER: adjust to match your business model.
 */
export const APPLICATION_FEE_AMOUNT = 50; // £0.50 per transaction
