import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ZKTecoSyncService } from '@/lib/zkteco/sync-service';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const adminUser = cookieStore.get('hestra_user')?.value || 'HR Administrator';

    const result = await ZKTecoSyncService.syncAllDevices(adminUser);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
