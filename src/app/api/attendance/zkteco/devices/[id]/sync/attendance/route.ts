import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ZKTecoSyncService } from '@/lib/zkteco/sync-service';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const adminUser = cookieStore.get('hestra_user')?.value || 'HR Administrator';

    let body: any = {};
    try {
      body = await request.json();
    } catch {}

    const result = await ZKTecoSyncService.syncDeviceAttendance(id, adminUser, {
      incremental: body.incremental !== false,
    });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
