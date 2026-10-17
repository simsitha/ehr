import { NextResponse } from 'next/server';
import { getZKTecoSyncLogs } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('device_id') || undefined;
    const limit = Number(searchParams.get('limit')) || 100;

    const logs = getZKTecoSyncLogs({ deviceId, limit });
    return NextResponse.json(logs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
