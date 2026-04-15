import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Workflow state queries are no longer supported' },
    { status: 410 },
  );
}
