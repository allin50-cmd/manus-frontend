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

  // When Stripe is not configured, return a clear signal (200, configured:false)
  // so the client can fall back to direct activation instead of erroring.
  if (!secretKey || !priceId) {
    return NextResponse.json({ configured: false })
  }

  const stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' })

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    req.nextUrl.origin ||
    'http://localhost:3000'

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { companyNumber, companyName },
      success_url: `${appUrl}/company-portal?activated=1&company=${encodeURIComponent(companyNumber)}`,
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
