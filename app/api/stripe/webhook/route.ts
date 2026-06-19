import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getDb } from '@/lib/db'
import { monitoredCompanies } from '@/db/schema'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!secretKey) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }
  if (!webhookSecret) {
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
      try {
        const db = await getDb()
        await db
          .insert(monitoredCompanies)
          .values({ companyNumber, companyName, stripeSessionId: session.id })
          .onConflictDoUpdate({
            target: monitoredCompanies.companyNumber,
            set: { stripeSessionId: session.id },
          })
      } catch (err) {
        console.error('Stripe monitoring activation failed:', String(err))
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ received: true })
}
