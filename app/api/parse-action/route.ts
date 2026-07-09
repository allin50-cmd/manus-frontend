import { NextResponse } from 'next/server'
import { parseActionRequest } from '@/lib/action-parser'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const input = typeof body?.input === 'string' ? body.input : ''

    if (!input.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Input is required' },
        { status: 400 }
      )
    }

    const result = parseActionRequest(input)
    return NextResponse.json({ ok: true, result })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'Unable to parse action request' },
      { status: 500 }
    )
  }
}
