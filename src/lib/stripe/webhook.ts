import Stripe from 'stripe';
import { activateCompanyMonitoring } from '@/server/services/alertActivation.service';

export async function handleWebhookEvent(event: Stripe.Event) {
  if (event.type !== 'checkout.session.completed') return;

  const session = event.data.object as Stripe.Checkout.Session;
  const companyNumber = session.metadata?.companyNumber;
  const companyName = session.metadata?.companyName;
  const alertTypesRaw = session.metadata?.alertTypes;

  if (!companyNumber || !companyName || !alertTypesRaw) return;

  const alertTypes = alertTypesRaw.split(',').filter(Boolean);

  await activateCompanyMonitoring({
    companyNumber,
    companyName,
    stripeSessionId: session.id,
    stripeSubscriptionId: session.subscription as string | undefined,
    stripeCustomerId: session.customer as string | undefined,
    alertTypes,
  });
}
