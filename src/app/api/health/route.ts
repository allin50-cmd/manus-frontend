import { NextResponse } from 'next/server';

// Basic process health — always 200 if the server is alive.
// Load balancers and ACI health probes should use this endpoint.
// Use /api/health/deps for full dependency status.
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
}
