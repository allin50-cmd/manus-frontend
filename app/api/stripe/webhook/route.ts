import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { and, eq, isNull } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { monitoredCompanies } from '@/db/schema'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!secretKey) {
    console.error('FINEGUARD OPS: STRIPE_SECRET_KEY is not set — webhook cannot be processed')
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }
  if (!webhookSecret) {
    console.error('FINEGUARD OPS: STRIPE_WEBHOOK_SECRET is not set — webhook signature cannot be verified')
    return NextResponse.json({ error: 'Stripe webhook secret not configured' }, { status: 500 })
  }

  const stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' })

  // Signature verification requires the exact raw request body.
  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    console.warn('Stripe webhook signature verification failed:', String(err))
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const companyNumber = session.metadata?.companyNumber
    const companyName = session.metadata?.companyName

    if (companyNumber && companyName) {
      const email = session.customer_details?.email ?? (session.customer_email ?? null)
      const subscriptionId =
        session.subscription != null
          ? typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription.id
          : null

      // Email is required for alerts to work. customer_creation:'always' in the
      // checkout session guarantees Stripe creates a customer with email, but
      // log loudly if it somehow arrives empty so ops can manually correct it.
      if (!email) {
        console.error(
          `FINEGUARD OPS: checkout.session.completed for ${companyName} (${companyNumber}) ` +
          `arrived with no customer email. This company will NOT receive deadline alerts ` +
          `until email is manually set in monitored_companies. Stripe session: ${session.id}`
        )
      }

      try {
        const db = await getDb()
        await db
          .insert(monitoredCompanies)
          .values({
            companyNumber,
            companyName,
            email,
            stripeSessionId: session.id,
            stripeSubscriptionId: subscriptionId,
            cancelledAt: null,
          })
          .onConflictDoUpdate({
            target: monitoredCompanies.companyNumber,
            set: {
              stripeSessionId: session.id,
              stripeSubscriptionId: subscriptionId,
              cancelledAt: null,
              // Only overwrite email if Stripe has one — preserve a manually-set address.
              ...(email ? { email } : {}),
            },
          })
        console.log(
          `FineGuard activated: ${companyName} (${companyNumber}), ` +
          `email=${email ?? 'MISSING — OPS ACTION REQUIRED'}, sub=${subscriptionId}`
        )
      } catch (err) {
        console.error('Stripe monitoring activation failed:', String(err))
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    try {
      const db = await getDb()
      const updated = await db
        .update(monitoredCompanies)
        .set({ cancelledAt: new Date() })
        .where(
          and(
            eq(monitoredCompanies.stripeSubscriptionId, sub.id),
            isNull(monitoredCompanies.cancelledAt),
          ),
        )
        .returning({
          companyNumber: monitoredCompanies.companyNumber,
          companyName: monitoredCompanies.companyName,
        })

      if (updated.length === 0) {
        console.log(
          `Stripe cancellation: no active company found for subscription ${sub.id} — ` +
          `already cancelled or not found`
        )
      } else {
        for (const row of updated) {
          console.log(`FineGuard monitoring cancelled: ${row.companyName} (${row.companyNumber}), sub=${sub.id}`)
        }
      }
    } catch (err) {
      console.error('Stripe cancellation handler failed:', String(err))
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
