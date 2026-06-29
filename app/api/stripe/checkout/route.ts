import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const companyNumber = String(body.companyNumber ?? '').trim()
  const companyName = String(body.companyName ?? '').trim()

  if (!companyNumber || !companyName) {
    return NextResponse.json(
      { error: 'companyNumber and companyName are required' },
      { status: 400 },
    )
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  const priceId = process.env.STRIPE_PRICE_ID

  if (!secretKey || !priceId) {
    console.error('FINEGUARD OPS: Stripe is not configured. STRIPE_SECRET_KEY and STRIPE_PRICE_ID must be set. No monitoring can be activated without payment.')
    return NextResponse.json(
      { error: 'Payment service is not available. Please contact hello@fineguard.co.uk' },
      { status: 503 },
    )
  }

  const stripe = new Stripe(secretKey, { apiVersion: '2026-06-24.dahlia' })

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    req.nextUrl.origin ||
    'http://localhost:3000'

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { companyNumber, companyName },
      // customer_creation: 'always' ensures Stripe creates a customer record,
      // which guarantees an email address is collected and passed to the webhook.
      customer_creation: 'always',
      success_url: `${appUrl}/check/success?company=${encodeURIComponent(companyName)}&number=${encodeURIComponent(companyNumber)}`,
      cancel_url: `${appUrl}/check`,
    })

    return NextResponse.json({ configured: true, url: session.url })
  } catch (err) {
    console.error('Stripe checkout session error:', err)
    return NextResponse.json(
      { configured: true, error: 'Failed to create checkout session' },
      { status: 502 },
    )
  }
}
