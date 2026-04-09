import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/server/db';

export async function GET() {
  const connected = await checkDatabaseConnection();
  if (!connected) {
    return NextResponse.json({ status: 'unhealthy', database: 'disconnected' }, { status: 503 });
  }
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString(), database: 'connected' });
}
