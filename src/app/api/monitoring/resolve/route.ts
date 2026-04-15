import { NextResponse } from 'next/server';

export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Workflow signalling is no longer supported' },
    { status: 410 },
  );
}
