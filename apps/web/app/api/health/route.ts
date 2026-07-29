import { NextResponse } from 'next/server';
import type { HealthResponse } from '@kuteka/types';
import { APP_VERSION } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export function GET() {
  const body: HealthResponse = {
    status: 'ok',
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body);
}
