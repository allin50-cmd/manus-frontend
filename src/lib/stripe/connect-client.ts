/**
 * Stripe Connect client
 *
 * A single StripeClient instance used for ALL Stripe operations in the
 * Connect integration.  Using a single client (rather than the legacy
 * `Stripe` class directly) is required for the V2 API surface
 * (stripeClient.v2.core.*).
 *
 * PLACEHOLDER: Replace the env var name if you store the key differently.
 * If STRIPE_SECRET_KEY is missing the module throws at import time so the
 * missing config surfaces immediately, not on the first request.
 */

import Stripe from 'stripe';

// ---------------------------------------------------------------------------
// Validate that the secret key is present at startup.
// ---------------------------------------------------------------------------
const apiKey = process.env.STRIPE_SECRET_KEY;
if (!apiKey) {
  throw new Error(
    '[connect-client] STRIPE_SECRET_KEY is not set. ' +
    'Add it in your environment variables before starting the server.',
  );
}

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
export const stripeClient = new Stripe(apiKey);

/**
 * The webhook secret used to verify incoming events from Stripe.
 * PLACEHOLDER: Set STRIPE_CONNECT_WEBHOOK_SECRET in your environment.
 * Use a separate secret for Connect webhooks (vs. your main webhook secret).
 */
export const connectWebhookSecret =
  process.env.STRIPE_CONNECT_WEBHOOK_SECRET ?? '';

/**
 * The webhook secret for standard (V1) subscription events.
 * PLACEHOLDER: Set STRIPE_WEBHOOK_SECRET in your environment.
 */
export const subscriptionWebhookSecret =
  process.env.STRIPE_WEBHOOK_SECRET ?? '';

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
