import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/password'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { currentPassword, newPassword } = await req.json()

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
  }

  // Verify current password (DB hash or default passcode)
  const stored = await db.userPassword.findUnique({ where: { person: session.person } })
  let currentOk: boolean
  if (stored) {
    currentOk = await verifyPassword(currentPassword, stored.hash)
  } else {
    const defaultPass = process.env.DEFAULT_PASSCODE ?? ''
    currentOk = currentPassword === defaultPass
  }

  if (!currentOk) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
  }

  const hash = await hashPassword(newPassword)
  await db.userPassword.upsert({
    where: { person: session.person },
    create: { person: session.person, hash },
    update: { hash },
  })

  return NextResponse.json({ ok: true })
}
