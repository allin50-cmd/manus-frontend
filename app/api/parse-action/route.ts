import { NextResponse } from 'next/server';
import { parseActionRequest } from '@/lib/action-parser';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body || typeof body.text !== 'string') {
      return NextResponse.json(
        { error: 'Expected JSON body with a text string.' },
        { status: 400 },
      );
    }

    return NextResponse.json(parseActionRequest(body.text));
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON request body.' },
      { status: 400 },
    );
  }
}
