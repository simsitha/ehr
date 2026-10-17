import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { UserMappingEngine } from '@/lib/zkteco/mapping-engine';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get('hestra_role')?.value;
    if (userRole === 'Employee') {
      return NextResponse.json({ error: 'Unauthorized: Admin permission required' }, { status: 403 });
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {}

    const result = UserMappingEngine.runAutoMatching(body.device_id);
    return NextResponse.json({
      success: true,
      message: `Auto-matching complete: ${result.newlyMapped} employees matched. ${result.remainsUnmapped} users need manual review.`,
      stats: result,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
