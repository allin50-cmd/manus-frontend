import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/db'
import { escHtml } from '../../../../lib/utils'

// Public endpoint — no auth required. Token is a UUID, cryptographically unguessable.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return new NextResponse(errorHtml('Missing token'), { status: 400, headers: { 'Content-Type': 'text/html' } })
  }

  const delivery = await db.alertDelivery.findUnique({
    where: { ackToken: token },
    include: { workItem: { select: { title: true, company: true } } },
  })

  if (!delivery) {
    return new NextResponse(errorHtml('Invalid or expired acknowledgement link.'), {
      status: 404,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  if (delivery.status === 'Acknowledged') {
    return new NextResponse(
      successHtml(delivery.workItem.title, delivery.workItem.company, 'already acknowledged'),
      { headers: { 'Content-Type': 'text/html' } },
    )
  }

  // Use updateMany with a status condition so that concurrent ack requests for
  // the same token are idempotent: only the first update wins (count === 1).
  const { count } = await db.alertDelivery.updateMany({
    where: { id: delivery.id, status: { not: 'Acknowledged' } },
    data: { status: 'Acknowledged', acknowledgedAt: new Date() },
  })

  if (count === 0) {
    // A concurrent request already acknowledged it.
    return new NextResponse(
      successHtml(delivery.workItem.title, delivery.workItem.company, 'already acknowledged'),
      { headers: { 'Content-Type': 'text/html' } },
    )
  }

  await db.alertEvent.create({
    data: {
      workItemId: delivery.workItemId,
      deliveryId: delivery.id,
      recipientId: delivery.recipientId,
      eventType: 'AlertAcknowledged',
      actorType: 'Recipient',
      payload: JSON.stringify({ via: 'email_link' }),
    },
  }).catch(() => {})

  return new NextResponse(
    successHtml(delivery.workItem.title, delivery.workItem.company, 'acknowledged'),
    { headers: { 'Content-Type': 'text/html' } },
  )
}

function successHtml(title: string, company: string | null, state: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Alert ${escHtml(state)}</title></head>
<body style="font-family:sans-serif;background:#f8fafc;min-height:100vh;display:flex;align-items:center;justify-content:center;margin:0;padding:24px;box-sizing:border-box">
  <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:40px 32px;max-width:480px;width:100%;text-align:center">
    <div style="width:56px;height:56px;background:#dcfce7;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:28px">&#10003;</div>
    <h1 style="color:#15803d;font-size:22px;margin:0 0 8px">Alert acknowledged</h1>
    <p style="color:#475569;font-size:15px;margin:0 0 4px"><strong>${escHtml(title)}</strong></p>
    ${company ? `<p style="color:#94a3b8;font-size:13px;margin:0 0 24px">${escHtml(company)}</p>` : '<p style="margin:0 0 24px"></p>'}
    <p style="color:#64748b;font-size:13px;margin:0">Thank you. This has been recorded in UltraCore Ops.</p>
  </div>
</body>
</html>`
}

function errorHtml(message: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Error</title></head>
<body style="font-family:sans-serif;background:#f8fafc;min-height:100vh;display:flex;align-items:center;justify-content:center;margin:0;padding:24px;box-sizing:border-box">
  <div style="background:#fff;border:1px solid #fecaca;border-radius:16px;padding:40px 32px;max-width:480px;width:100%;text-align:center">
    <div style="width:56px;height:56px;background:#fee2e2;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:28px">✕</div>
    <h1 style="color:#dc2626;font-size:22px;margin:0 0 12px">Link not valid</h1>
    <p style="color:#64748b;font-size:14px;margin:0">${message}</p>
  </div>
</body>
</html>`
}
