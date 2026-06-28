import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { fineguardLeads } from '@/db/schema'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const email = String(body.email ?? '').trim().toLowerCase()
  const companyName = String(body.companyName ?? '').trim() || null
  const companyNumber = String(body.companyNumber ?? '').trim() || null
  const status = String(body.status ?? '').trim() || null

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  try {
    const db = await getDb()
    await db.insert(fineguardLeads).values({ email, companyName, companyNumber, status })
  } catch (err) {
    console.error('fineguard-leads insert failed:', err)
    // Don't surface DB errors to the user — lead capture is best-effort
  }

  // Notify team via Resend (best-effort — silently skip if not configured)
  const resendKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM || 'FineGuard Alerts <alerts@fineguard.co.uk>'
  if (resendKey) {
    const statusLabel = status === 'green' ? 'GREEN ✓' : status === 'amber' ? 'AMBER ⚠' : status === 'red' ? 'RED ✗' : 'Unknown'
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: 'hello@fineguard.co.uk',
        subject: `New FineGuard lead — ${email}`,
        html: `<p><strong>Email:</strong> ${email}</p>
<p><strong>Company:</strong> ${companyName ?? '—'} (${companyNumber ?? '—'})</p>
<p><strong>Status:</strong> ${statusLabel}</p>`,
        reply_to: email,
      }),
    }).catch(() => null)
  }

  return NextResponse.json({ ok: true })
}
